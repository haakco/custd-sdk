<?php

declare(strict_types=1);

namespace HaakCo\Custd\Admin\Accounting;

/**
 * AccountingEvidenceKind names the values of AccountingEvidence.kind, AccountingEvidence.targetKind,
 * AccountingEvidenceCreateRequest.kind, AccountingEvidenceCreateRequest.targetKind.
 * A value Custd adds later still decodes as a plain string.
 */
final class AccountingEvidenceKind
{
    public const PURCHASE = 'purchase';
    public const BALANCE = 'balance';
    public const CORRECTION = 'correction';
}
