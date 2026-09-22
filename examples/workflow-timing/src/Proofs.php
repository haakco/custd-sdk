<?php

declare(strict_types=1);

namespace HaakCo\Custd\Examples\WorkflowTiming;

/**
 * Proofs collects named assertions so the journey reports every failure rather
 * than stopping at the first one, and exits non-zero when any proof failed.
 */
final class Proofs
{
    private int $passed = 0;

    /** @var list<string> */
    private array $failures = [];

    public function check(string $name, bool $ok, string $detail = ''): void
    {
        if ($ok) {
            $this->passed++;
            fwrite(STDOUT, sprintf("  PASS  %s%s\n", $name, $detail === '' ? '' : " ({$detail})"));

            return;
        }
        $this->failures[] = $name;
        fwrite(STDOUT, sprintf("  FAIL  %s%s\n", $name, $detail === '' ? '' : " ({$detail})"));
    }

    /** note records an observation that is evidence rather than an assertion. */
    public function note(string $message): void
    {
        fwrite(STDOUT, "  ....  {$message}\n");
    }

    public function section(string $title): void
    {
        fwrite(STDOUT, "\n{$title}\n");
    }

    public function exitCode(): int
    {
        if ($this->failures === []) {
            fwrite(STDOUT, sprintf("\nreference journey: all %d proofs passed\n", $this->passed));

            return 0;
        }
        fwrite(STDERR, sprintf(
            "\nreference journey: %d proof(s) failed: %s\n",
            count($this->failures),
            implode(', ', $this->failures),
        ));

        return 1;
    }
}
