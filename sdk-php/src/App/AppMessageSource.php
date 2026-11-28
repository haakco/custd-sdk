<?php

declare(strict_types=1);

namespace HaakCo\Custd\App;

enum AppMessageSource: string
{
    case Sms = 'sms';
    case IMessage = 'imessage';
    case WhatsApp = 'whatsapp';
}
