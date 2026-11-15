<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

use HaakCo\Custd\CustdClient;

/** Native bounded error capture. Keeps no global scope, request data or retry queue. */
final class Client
{
    private int $captures = 0;

    /** @param null|callable(DeliveryRequest):int $transport Returns an HTTP status; throws on transport failure. */
    public function __construct(private readonly Config $config, private readonly mixed $transport = null)
    {
    }

    public function captureException(CaptureRequest $request): CaptureResult
    {
        if ($this->captures >= 20) {
            return new CaptureResult(CaptureOutcome::Limited);
        }
        $this->captures++;
        try {
            $id = bin2hex(random_bytes(16));
            $event = [
                'event_id' => $id,
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
                'platform' => 'php',
                'level' => 'error',
                'environment' => $this->config->environment,
                'sdk' => ['name' => 'custd.php', 'version' => CustdClient::VERSION],
                'exception' => ['values' => self::exceptions($request)],
            ];
            if ($this->config->release !== null) {
                $event['release'] = $this->config->release;
            }
            if ($request->correlationId !== null && preg_match('/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/D', $request->correlationId) === 1) {
                $event['tags'] = ['correlation_id' => $request->correlationId];
            }
            $body = json_encode(['event_id' => $id, 'dsn' => $this->config->dsn], JSON_THROW_ON_ERROR)
                ."\n{\"type\":\"event\"}\n".json_encode($event, JSON_THROW_ON_ERROR);
            if (strlen($body) > 16_384) {
                return new CaptureResult(CaptureOutcome::Limited);
            }
            $delivery = new DeliveryRequest($this->config->origin.'/api/v1/errors/api/1/envelope/', $body);
            $status = $this->transport !== null ? ($this->transport)($delivery) : self::send($delivery);

            return new CaptureResult($status >= 200 && $status < 300 ? CaptureOutcome::Accepted : CaptureOutcome::Rejected, $status);
        } catch (\Throwable) {
            return new CaptureResult(CaptureOutcome::Unavailable);
        }
    }

    /** @return list<array{type:string,mechanism:array{handled:bool},stacktrace:array{frames:list<array{filename:string,lineno:int}>}}> */
    private static function exceptions(CaptureRequest $request): array
    {
        $exceptions = [];
        for ($error = $request->error; $error !== null && count($exceptions) < 4; $error = $error->getPrevious()) {
            $type = get_class($error);
            $type = preg_match('/^[A-Za-z_\\\\][A-Za-z0-9_\\\\]{0,255}$/D', $type) === 1 ? $type : 'Error';
            $frames = [];
            $locations = [['file' => $error->getFile(), 'line' => $error->getLine()], ...array_slice($error->getTrace(), 0, 23)];
            foreach ($locations as $location) {
                $filename = rawurldecode(basename(str_replace('\\', '/', preg_replace('/[?#].*$/', '', $location['file'] ?? '') ?? '')));
                if (preg_match('/^[A-Za-z0-9_.+\[\]-]{1,128}\.php$/D', $filename) === 1) {
                    $frames[] = ['filename' => $filename, 'lineno' => max(0, min((int) ($location['line'] ?? 0), 1_000_000))];
                }
            }
            $exceptions[] = ['type' => $type, 'mechanism' => ['handled' => $request->mode === CaptureMode::Handled], 'stacktrace' => ['frames' => array_reverse($frames)]];
        }

        return array_reverse($exceptions);
    }

    private static function send(DeliveryRequest $request): int
    {
        $handle = curl_init($request->url);
        if ($handle === false) {
            throw new \RuntimeException('custd: error capture transport unavailable');
        }
        try {
            $received = 0;
            curl_setopt_array($handle, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $request->body,
                CURLOPT_HTTPHEADER => ['Content-Type: text/plain'],
                CURLOPT_CONNECTTIMEOUT_MS => 500,
                CURLOPT_TIMEOUT_MS => 2000,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTPS | CURLPROTO_HTTP,
                CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$received): int {
                    $received += strlen($chunk);

                    return $received <= 4096 ? strlen($chunk) : 0;
                },
            ]);
            if (curl_exec($handle) === false) {
                throw new \RuntimeException('custd: error capture transport unavailable');
            }

            return (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        } finally {
            curl_close($handle);
        }
    }
}
