<?php

namespace App;

/**
 * The value is the Hungarian slug used everywhere the category is addressable.
 * Keeping one vocabulary end to end is what stops the disk from growing a second set of folders.
 */
enum DocumentCategory: string {
    case IntegraFlyer = 'tajekoztato';
    case IntegraTrial = 'probaverzio';
    case IntegraUpdate = 'programfrissites';
    case IntegraDocumentation = 'dokumentacio';
    case IntegraOther = 'egyeb';
}
