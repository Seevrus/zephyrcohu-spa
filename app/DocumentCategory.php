<?php

namespace App;

enum DocumentCategory: string {
    case IntegraFlyer = 'integra-flyer';
    case IntegraTrial = 'integra-trial';
    case IntegraUpdate = 'integra-update';
    case IntegraDocumentation = 'integra-documentation';
    case IntegraOther = 'integra-other';
}
