<?php

namespace App;

enum OfferRequestSubject: string {
    case INTEGRA_NEW_CLIENT_GENERAL = 'integra-new-client-general';
    case INTEGRA_NEW_CLIENT_ACCOUNTING_FIRM = 'integra-new-client-accounting-firm';
    case INTEGRA_NEW_CLIENT_INVOICING_ONLY = 'integra-new-client-invoicing-only';
    case INTEGRA_NEW_CLIENT_PAYROLL_ONLY = 'integra-new-client-payroll-only';
    case INTEGRA_NEW_CLIENT_OTHER = 'integra-new-client-other';
    case INTEGRA_EXISTING_CLIENT_SUBSYSTEMS = 'integra-existing-client-subsystems';
    case INTEGRA_EXISTING_CLIENT_CUSTOM_DEV = 'integra-existing-client-custom-dev';
    case INTEGRA_EXISTING_CLIENT_OTHER = 'integra-existing-client-other';
    case INTEGRA_SOFTWARE_RENTAL = 'integra-software-rental';
    case INTEGRA_FLAT_RATE_REMOTE = 'integra-flat-rate-remote';
    case FLAT_RATE_ONSITE_SUPPORT = 'flat-rate-onsite-support';
    case FLAT_RATE_REMOTE_ACCESS = 'flat-rate-remote-access';
    case TASK_OS_MAINTENANCE = 'task-os-maintenance';
    case TASK_OTHER_UPDATES = 'task-other-updates';
    case TASK_DEVICE_MAINTENANCE = 'task-device-maintenance';
    case TASK_NETWORK_MANAGEMENT = 'task-network-management';
    case TASK_VIRUS_ISSUES = 'task-virus-issues';
    case TASK_INTEGRA_DATABASE = 'task-integra-database';
    case TASK_INTEGRA_SETTINGS = 'task-integra-settings';
    case TASK_INTEGRA_DEV_IDEAS = 'task-integra-dev-ideas';
    case TASK_OTHER = 'task-other';
    case NOD32_ANTIVIRUS = 'nod32-antivirus';
    case DEVICE_PURCHASE = 'device-purchase';
    case OTHER = 'other';

    public function label(): string {
        return match ($this) {
            self::INTEGRA_NEW_CLIENT_GENERAL => 'Zephyr INTEGRA - új ügyfél, cégügyvitel',
            self::INTEGRA_NEW_CLIENT_ACCOUNTING_FIRM => 'Zephyr INTEGRA - új ügyfél, könyvelő iroda',
            self::INTEGRA_NEW_CLIENT_INVOICING_ONLY => 'Zephyr INTEGRA - új ügyfél, csak számlázó program',
            self::INTEGRA_NEW_CLIENT_PAYROLL_ONLY => 'Zephyr INTEGRA - új ügyfél, csak bér- és munkaügy',
            self::INTEGRA_NEW_CLIENT_OTHER => 'Zephyr INTEGRA - új ügyfél, egyéb felhasználási cél',
            self::INTEGRA_EXISTING_CLIENT_SUBSYSTEMS => 'Zephyr INTEGRA - meglévő ügyfél, kiegészítés alrendszerekkel',
            self::INTEGRA_EXISTING_CLIENT_CUSTOM_DEV => 'Zephyr INTEGRA - meglévő ügyfél, egyedi fejlesztés',
            self::INTEGRA_EXISTING_CLIENT_OTHER => 'Zephyr INTEGRA - meglévő ügyfél, egyéb feladatok',
            self::INTEGRA_SOFTWARE_RENTAL => 'Zephyr INTEGRA - szoftverbérlet',
            self::INTEGRA_FLAT_RATE_REMOTE => 'Zephyr INTEGRA - átalánydíjas távoli használat',
            self::FLAT_RATE_ONSITE_SUPPORT => 'Átalánydíjas helyszíni fejlesztői támogatás',
            self::FLAT_RATE_REMOTE_ACCESS => 'Átalánydíjas távoli elérési szolgáltatás',
            self::TASK_OS_MAINTENANCE => 'Munkaigénylés: operációs rendszer karbantartása (Windows)',
            self::TASK_OTHER_UPDATES => 'Munkaigénylés: egyéb frissítések (ÁNYK, Java, stb.)',
            self::TASK_DEVICE_MAINTENANCE => 'Munkaigénylés: eszközkarbantartás (számítógépek, nyomtatók, stb.)',
            self::TASK_NETWORK_MANAGEMENT => 'Munkaigénylés: számítógéphálózat-kezelés, -hálózatépítés',
            self::TASK_VIRUS_ISSUES => 'Munkaigénylés: vírus-problémák',
            self::TASK_INTEGRA_DATABASE => 'Munkaigénylés: Zephyr INTEGRA adatbázis-feladatok',
            self::TASK_INTEGRA_SETTINGS => 'Munkaigénylés: Zephyr INTEGRA beállítások, testreszabás, szervezés',
            self::TASK_INTEGRA_DEV_IDEAS => 'Munkaigénylés: Zephyr INTEGRA fejlesztési ötletek, hibajelzések',
            self::TASK_OTHER => 'Munkaigénylés: egyéb',
            self::NOD32_ANTIVIRUS => 'NOD32 antivírus-megoldások (új licenc, hosszabbítás, stb.)',
            self::DEVICE_PURCHASE => 'Eszközvásárlás (számítógép, periféria, tartozék, kellékanyag)',
            self::OTHER => 'Egyéb (a fentiekhez nem sorolható)',
        };
    }
}
