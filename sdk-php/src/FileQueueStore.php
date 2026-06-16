<?php

declare(strict_types=1);

namespace HaakCo\Custd;

final class FileQueueStore implements QueueStore
{
    private string $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }

    public function load(): array
    {
        if (!file_exists($this->path)) {
            return [];
        }
        $handle = $this->openExistingQueueFile("rb");
        flock($handle, LOCK_SH);
        $raw = stream_get_contents($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        if ($raw === false || $raw === "") {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function save(array $events): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        if (file_exists($this->path)) {
            $this->assertSafeQueueFile();
        }

        $tmp = tempnam($dir, ".custd-queue-");
        if ($tmp === false) {
            throw new \RuntimeException("custd: failed to create queue file");
        }
        chmod($tmp, 0600);
        $handle = fopen($tmp, "wb");
        if ($handle === false) {
            unlink($tmp);
            throw new \RuntimeException("custd: failed to open queue file");
        }
        flock($handle, LOCK_EX);
        fwrite($handle, json_encode($events, JSON_THROW_ON_ERROR));
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
        if (!rename($tmp, $this->path)) {
            unlink($tmp);
            throw new \RuntimeException("custd: failed to replace queue file");
        }
    }

    public function clear(): void
    {
        if (file_exists($this->path)) {
            $this->assertSafeQueueFile();
            unlink($this->path);
        }
    }

    private function assertSafeQueueFile(): void
    {
        if (is_link($this->path) || !is_file($this->path)) {
            throw new \RuntimeException("custd: unsafe queue file path");
        }
    }

    /**
     * @return resource
     */
    private function openExistingQueueFile(string $mode)
    {
        $statBefore = lstat($this->path);
        $this->assertSafeQueueFile();

        $handle = fopen($this->path, $mode);
        if ($handle === false) {
            throw new \RuntimeException("custd: failed to open queue file");
        }

        $statAfter = fstat($handle);
        if ($statBefore === false || $statAfter === false || !$this->sameFile($statBefore, $statAfter)) {
            fclose($handle);
            throw new \RuntimeException("custd: unsafe queue file path");
        }
        return $handle;
    }

    /**
     * @param array<string, int> $a
     * @param array<string, int> $b
     */
    private function sameFile(array $a, array $b): bool
    {
        return ($a["dev"] ?? null) === ($b["dev"] ?? null)
            && ($a["ino"] ?? null) === ($b["ino"] ?? null);
    }
}
