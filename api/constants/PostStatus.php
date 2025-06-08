<?php

namespace Api\Constants;

enum PostStatus: string
{
    case DRAFT = 'DRAFT';
    case PUBLISHED = 'PUBLISHED';
    case ARCHIVED = 'ARCHIVED';
    case DELETED = 'DELETED';

    public static function fromString(string $status): self
    {
        return match (strtoupper($status)) {
            'DRAFT' => self::DRAFT,
            'PUBLISHED' => self::PUBLISHED,
            'ARCHIVED' => self::ARCHIVED,
            'DELETED' => self::DELETED,
            default => throw new \InvalidArgumentException("Invalid post status: $status"),
        };
    }

    public function toString(): string
    {
        return $this->value;
    }

    public static function getStatusForNewPost(string $status): self
    {
        return match (strtoupper($status)) {
            'DRAFT' => self::DRAFT,
            'PUBLISHED' => self::PUBLISHED,
            default => throw new \InvalidArgumentException("Invalid status for new post: $status"),
        };
    }
}
