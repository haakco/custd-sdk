<?php

declare(strict_types=1);

namespace HaakCo\Custd\ErrorTracking;

final readonly class Config
{
    public string $origin;

    public string $dsn;

    public function __construct(
        string $baseUrl,
        string $writeKey,
        public string $environment,
        public ?string $release = null,
    ) {
        $url = parse_url($baseUrl);
        $local = in_array($url['host'] ?? '', ['localhost', '127.0.0.1', '[::1]', 'host.docker.internal'], true);
        if (! is_array($url) || ! isset($url['host'])
            || (($url['scheme'] ?? '') !== 'https' && ! (($url['scheme'] ?? '') === 'http' && $local))
            || isset($url['user']) || isset($url['pass']) || isset($url['query']) || isset($url['fragment'])
            || ! in_array($url['path'] ?? '', ['', '/'], true)
            || preg_match('/^site_pk_[a-f0-9]{32,128}$/D', $writeKey) !== 1
            || preg_match('/^[a-zA-Z0-9._-]{1,64}$/D', $environment) !== 1
            || ($release !== null && preg_match('/^[a-zA-Z0-9@._+-]{1,200}$/D', $release) !== 1)
        ) {
            throw new \InvalidArgumentException('custd: invalid error capture configuration');
        }
        $authority = $url['host'].(isset($url['port']) ? ':'.$url['port'] : '');
        $this->origin = $url['scheme'].'://'.$authority;
        $this->dsn = $url['scheme'].'://'.$writeKey.'@'.$authority.'/api/v1/errors/1';
    }
}
