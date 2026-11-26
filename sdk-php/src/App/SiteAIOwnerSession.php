<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

use HaakCo\Custd\Admin\SiteDomain\SiteAIConsentRequest;
use HaakCo\Custd\Admin\SiteDomain\SiteAIOwnerSettings;
use HaakCo\Custd\Admin\SiteDomain\SiteAISettings;
use HaakCo\Custd\Admin\SiteDomain\SiteAISettingsRequest;

/**
 * SiteAIOwnerSession is a signed-in AI settings session opened by redeeming a handoff. It sends the session
 * cookie, and on a write the Custd origin and the write binding; it never sends a client credential or an
 * acting company, because the session selects its own tenant.
 */
final class SiteAIOwnerSession
{
    public const PATH = '/api/v1/site-ai-owner';
    public const COOKIE = '__Host-custd-site-ai-owner';
    private const BINDING_HEADER = 'X-Custd-Site-AI-Session';

    /**
     * @internal Opened by {@see PublicReadClient::redeemSiteAIOwnerHandoff()} or resumed by
     *     {@see PublicReadClient::resumeSiteAIOwnerSession()}.
     * @param string $origin The Custd origin the session belongs to.
     * @param string $handle The session cookie's value; keep it server-side to resume the session on a later
     *     request.
     * @param string $binding The write binding from the last {@see getSettings()}, or empty to read it first.
     */
    public function __construct(
        private readonly AppHttp $http,
        public readonly string $origin,
        #[\SensitiveParameter] public readonly string $handle,
        private string $binding = '',
    ) {
    }

    /** The write binding the last {@see getSettings()} returned, empty before the first read. */
    public function binding(): string
    {
        return $this->binding;
    }

    /** Read the session tenant's AI settings; this also refreshes the binding the writes carry. */
    public function getSettings(): SiteAIOwnerSettings
    {
        $settings = SiteAIOwnerSettings::fromPayload($this->send('GET', '/settings', null));
        $this->binding = $settings->sessionBinding;

        return $settings;
    }

    /** Replace the session tenant's AI mode and monthly cap. */
    public function setSettings(SiteAISettingsRequest $request): SiteAISettings
    {
        return $this->write('/settings', $request->serialise());
    }

    /** Record or revoke the session tenant's AI terms consent. */
    public function setConsent(SiteAIConsentRequest $request): SiteAISettings
    {
        return $this->write('/consent', $request->serialise());
    }

    /**
     * A write reads the binding first when the session has none, so a caller can write straight after
     * redeeming.
     *
     * @param array<string, mixed> $body
     */
    private function write(string $path, array $body): SiteAISettings
    {
        if ($this->binding === '') {
            $this->getSettings();
        }

        return SiteAISettings::fromPayload($this->send('PUT', $path, $body));
    }

    /** @param array<string, mixed>|null $body */
    private function send(string $method, string $path, ?array $body): \stdClass
    {
        $headers = ['Cookie' => self::COOKIE . '=' . $this->handle];
        if ($body !== null) {
            $headers += ['Origin' => $this->origin, self::BINDING_HEADER => $this->binding];
        }

        return $this->http->object($method, self::PATH . $path, [], $body, '', $headers);
    }

    /**
     * The Custd origin a handoff's redeem URL names, refusing any other address so a handoff cannot send the
     * code elsewhere.
     *
     * @internal
     */
    public static function originOf(string $redeemUrl): string
    {
        $parts = parse_url($redeemUrl);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host']) || isset($parts['user']) || isset($parts['query'])
            || isset($parts['fragment']) || ($parts['path'] ?? '') !== self::PATH . '/redeem') {
            throw new \InvalidArgumentException('custd: an AI owner handoff needs the Custd redeem URL');
        }
        $scheme = $parts['scheme'];

        return self::checkedOrigin($scheme . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : ''));
    }

    /**
     * An HTTPS origin, or plain HTTP to a loopback host, with no path, query or credentials.
     *
     * @internal
     */
    public static function checkedOrigin(string $origin): string
    {
        $parts = parse_url($origin);
        $scheme = is_array($parts) ? ($parts['scheme'] ?? '') : '';
        $local = is_array($parts) && in_array($parts['host'] ?? '', ['localhost', '127.0.0.1'], true);
        $bare = is_array($parts) && isset($parts['host']) && array_diff(array_keys($parts), ['scheme', 'host', 'port']) === [];
        if (!$bare || !($scheme === 'https' || ($scheme === 'http' && $local))) {
            throw new \InvalidArgumentException('custd: an AI owner session needs the Custd HTTPS origin');
        }

        return $origin;
    }

    /**
     * The session handle the redeem answer's Set-Cookie carries.
     *
     * @internal
     * @param array<string, string> $headers
     */
    public static function handleFrom(array $headers): string
    {
        foreach ($headers as $name => $value) {
            if (strtolower($name) === 'set-cookie' && str_starts_with($value, self::COOKIE . '=')) {
                $handle = explode(';', substr($value, strlen(self::COOKIE) + 1), 2)[0];
                if ($handle !== '') {
                    return $handle;
                }
            }
        }
        throw new \UnexpectedValueException('custd: the AI owner redeem returned no session cookie');
    }
}
