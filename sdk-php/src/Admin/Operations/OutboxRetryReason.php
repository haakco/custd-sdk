<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Operations;

/** A sanitized notification delivery retry category. */
enum OutboxRetryReason: string
{
    case ProviderTransient = 'provider_transient';
    case AuthenticationRejected = 'authentication_rejected';
    case TlsFailure = 'tls_failure';
    case ConnectionFailure = 'connection_failure';
    case SenderRejected = 'sender_rejected';
    case RecipientRejected = 'recipient_rejected';
    case UnclassifiedRetry = 'unclassified_retry';
}
