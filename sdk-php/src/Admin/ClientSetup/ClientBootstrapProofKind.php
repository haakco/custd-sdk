<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\ClientSetup;

/**
 * ClientBootstrapProofKind names the values of ClientBootstrapProof.kind.
 * A value Custd adds later still decodes as a plain string.
 */
final class ClientBootstrapProofKind
{
    public const DNS_TXT = 'dns_txt';
    public const EMAIL_LINK = 'email_link';
}
