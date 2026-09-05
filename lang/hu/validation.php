<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Hungarian translations of the default validator messages. The application
    | locale and fallback locale are both `hu`, so without this file every
    | validation message is returned as its raw translation key
    | (e.g. `validation.max.file`).
    |
    */

    'accepted' => 'A(z) :attribute mező elfogadása kötelező.',
    'accepted_if' => 'A(z) :attribute mező elfogadása kötelező, ha :other értéke :value.',
    'active_url' => 'A(z) :attribute mező nem érvényes URL.',
    'after' => 'A(z) :attribute mezőnek :date utáni dátumot kell tartalmaznia.',
    'after_or_equal' => 'A(z) :attribute mezőnek :date utáni vagy azzal egyező dátumot kell tartalmaznia.',
    'alpha' => 'A(z) :attribute mező csak betűket tartalmazhat.',
    'alpha_dash' => 'A(z) :attribute mező csak betűket, számokat, kötőjelet és aláhúzásjelet tartalmazhat.',
    'alpha_num' => 'A(z) :attribute mező csak betűket és számokat tartalmazhat.',
    'any_of' => 'A(z) :attribute mező értéke érvénytelen.',
    'array' => 'A(z) :attribute mezőnek tömbnek kell lennie.',
    'array_keys' => 'A(z) :attribute mező csak a következő kulcsokat tartalmazhatja: :values.',
    'ascii' => 'A(z) :attribute mező csak egybájtos alfanumerikus karaktereket és szimbólumokat tartalmazhat.',
    'base64' => 'A(z) :attribute mezőnek érvényes Base64 szövegnek kell lennie.',
    'before' => 'A(z) :attribute mezőnek :date előtti dátumot kell tartalmaznia.',
    'before_or_equal' => 'A(z) :attribute mezőnek :date előtti vagy azzal egyező dátumot kell tartalmaznia.',
    'between' => [
        'array' => 'A(z) :attribute mezőnek :min és :max közötti számú elemet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete :min és :max kilobájt közötti lehet.',
        'numeric' => 'A(z) :attribute mező értéke :min és :max közötti lehet.',
        'string' => 'A(z) :attribute mező :min és :max karakter közötti hosszúságú lehet.',
    ],
    'boolean' => 'A(z) :attribute mező értéke csak igaz vagy hamis lehet.',
    'can' => 'A(z) :attribute mező nem engedélyezett értéket tartalmaz.',
    'confirmed' => 'A(z) :attribute mező megerősítése nem egyezik.',
    'contains' => 'A(z) :attribute mezőből hiányzik egy kötelező érték.',
    'current_password' => 'A megadott jelszó helytelen.',
    'date' => 'A(z) :attribute mező nem érvényes dátum.',
    'date_equals' => 'A(z) :attribute mezőnek :date dátummal egyezőnek kell lennie.',
    'date_format' => 'A(z) :attribute mezőnek a következő formátumúnak kell lennie: :format.',
    'decimal' => 'A(z) :attribute mezőnek :decimal tizedesjegyet kell tartalmaznia.',
    'declined' => 'A(z) :attribute mező elutasítása kötelező.',
    'declined_if' => 'A(z) :attribute mező elutasítása kötelező, ha :other értéke :value.',
    'different' => 'A(z) :attribute és a(z) :other mezőnek különböznie kell.',
    'digits' => 'A(z) :attribute mezőnek :digits számjegyből kell állnia.',
    'digits_between' => 'A(z) :attribute mezőnek :min és :max közötti számú számjegyből kell állnia.',
    'dimensions' => 'A(z) :attribute mező képméretei érvénytelenek.',
    'distinct' => 'A(z) :attribute mező ismétlődő értéket tartalmaz.',
    'doesnt_contain' => 'A(z) :attribute mező nem tartalmazhatja a következőket: :values.',
    'doesnt_end_with' => 'A(z) :attribute mező nem végződhet a következőkre: :values.',
    'doesnt_start_with' => 'A(z) :attribute mező nem kezdődhet a következőkkel: :values.',
    'email' => 'A(z) :attribute mező nem érvényes email cím.',
    'encoding' => 'A(z) :attribute mezőnek :encoding kódolásúnak kell lennie.',
    'ends_with' => 'A(z) :attribute mezőnek a következők egyikére kell végződnie: :values.',
    'enum' => 'A kiválasztott :attribute érvénytelen.',
    'exists' => 'A kiválasztott :attribute érvénytelen.',
    'extensions' => 'A(z) :attribute kiterjesztése a következők egyike lehet: :values.',
    'file' => 'A(z) :attribute mezőnek fájlnak kell lennie.',
    'filled' => 'A(z) :attribute mező kitöltése kötelező.',
    'gt' => [
        'array' => 'A(z) :attribute mezőnek :value elemnél többet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete :value kilobájtnál nagyobb kell legyen.',
        'numeric' => 'A(z) :attribute mező értéke :value-nál nagyobb kell legyen.',
        'string' => 'A(z) :attribute mező :value karakternél hosszabb kell legyen.',
    ],
    'gte' => [
        'array' => 'A(z) :attribute mezőnek legalább :value elemet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete legalább :value kilobájt kell legyen.',
        'numeric' => 'A(z) :attribute mező értéke legalább :value kell legyen.',
        'string' => 'A(z) :attribute mező legalább :value karakter hosszú kell legyen.',
    ],
    'hex_color' => 'A(z) :attribute mezőnek érvényes hexadecimális színkódnak kell lennie.',
    'image' => 'A(z) :attribute mezőnek képnek kell lennie.',
    'in' => 'A kiválasztott :attribute érvénytelen.',
    'in_array' => 'A(z) :attribute mezőnek szerepelnie kell a(z) :other mezőben.',
    'in_array_keys' => 'A(z) :attribute mezőnek tartalmaznia kell legalább egyet a következő kulcsok közül: :values.',
    'integer' => 'A(z) :attribute mezőnek egész számnak kell lennie.',
    'ip' => 'A(z) :attribute mezőnek érvényes IP címnek kell lennie.',
    'ipv4' => 'A(z) :attribute mezőnek érvényes IPv4 címnek kell lennie.',
    'ipv6' => 'A(z) :attribute mezőnek érvényes IPv6 címnek kell lennie.',
    'json' => 'A(z) :attribute mezőnek érvényes JSON szövegnek kell lennie.',
    'list' => 'A(z) :attribute mezőnek listának kell lennie.',
    'lowercase' => 'A(z) :attribute mező csak kisbetűket tartalmazhat.',
    'lt' => [
        'array' => 'A(z) :attribute mezőnek :value elemnél kevesebbet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete :value kilobájtnál kisebb kell legyen.',
        'numeric' => 'A(z) :attribute mező értéke :value-nál kisebb kell legyen.',
        'string' => 'A(z) :attribute mező :value karakternél rövidebb kell legyen.',
    ],
    'lte' => [
        'array' => 'A(z) :attribute mező legfeljebb :value elemet tartalmazhat.',
        'file' => 'A(z) :attribute mérete legfeljebb :value kilobájt lehet.',
        'numeric' => 'A(z) :attribute mező értéke legfeljebb :value lehet.',
        'string' => 'A(z) :attribute mező legfeljebb :value karakter hosszú lehet.',
    ],
    'mac_address' => 'A(z) :attribute mezőnek érvényes MAC címnek kell lennie.',
    'max' => [
        'array' => 'A(z) :attribute mező legfeljebb :max elemet tartalmazhat.',
        'file' => 'A(z) :attribute mérete legfeljebb :max kilobájt lehet.',
        'numeric' => 'A(z) :attribute mező értéke legfeljebb :max lehet.',
        'string' => 'A(z) :attribute mező legfeljebb :max karakter hosszú lehet.',
    ],
    'max_digits' => 'A(z) :attribute mező legfeljebb :max számjegyet tartalmazhat.',
    'mimes' => 'A(z) :attribute mezőnek a következő típusú fájlnak kell lennie: :values.',
    'mimetypes' => 'A(z) :attribute mezőnek a következő típusú fájlnak kell lennie: :values.',
    'min' => [
        'array' => 'A(z) :attribute mezőnek legalább :min elemet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete legalább :min kilobájt kell legyen.',
        'numeric' => 'A(z) :attribute mező értéke legalább :min kell legyen.',
        'string' => 'A(z) :attribute mező legalább :min karakter hosszú kell legyen.',
    ],
    'min_digits' => 'A(z) :attribute mezőnek legalább :min számjegyet kell tartalmaznia.',
    'missing' => 'A(z) :attribute mező nem szerepelhet a kérésben.',
    'missing_if' => 'A(z) :attribute mező nem szerepelhet a kérésben, ha :other értéke :value.',
    'missing_unless' => 'A(z) :attribute mező nem szerepelhet a kérésben, hacsak :other értéke nem :value.',
    'missing_with' => 'A(z) :attribute mező nem szerepelhet a kérésben, ha :values jelen van.',
    'missing_with_all' => 'A(z) :attribute mező nem szerepelhet a kérésben, ha :values jelen vannak.',
    'multiple_of' => 'A(z) :attribute mező értékének :value többszörösének kell lennie.',
    'not_in' => 'A kiválasztott :attribute érvénytelen.',
    'not_regex' => 'A(z) :attribute mező formátuma érvénytelen.',
    'numeric' => 'A(z) :attribute mezőnek számnak kell lennie.',
    'password' => [
        'letters' => 'A(z) :attribute mezőnek legalább egy betűt kell tartalmaznia.',
        'mixed' => 'A(z) :attribute mezőnek legalább egy kis- és egy nagybetűt kell tartalmaznia.',
        'numbers' => 'A(z) :attribute mezőnek legalább egy számot kell tartalmaznia.',
        'symbols' => 'A(z) :attribute mezőnek legalább egy szimbólumot kell tartalmaznia.',
        'uncompromised' => 'A megadott :attribute szerepel egy adatszivárgásban. Kérjük, válassz másikat!',
    ],
    'present' => 'A(z) :attribute mezőnek szerepelnie kell a kérésben.',
    'present_if' => 'A(z) :attribute mezőnek szerepelnie kell a kérésben, ha :other értéke :value.',
    'present_unless' => 'A(z) :attribute mezőnek szerepelnie kell a kérésben, hacsak :other értéke nem :value.',
    'present_with' => 'A(z) :attribute mezőnek szerepelnie kell a kérésben, ha :values jelen van.',
    'present_with_all' => 'A(z) :attribute mezőnek szerepelnie kell a kérésben, ha :values jelen vannak.',
    'prohibited' => 'A(z) :attribute mező nem engedélyezett.',
    'prohibited_if' => 'A(z) :attribute mező nem engedélyezett, ha :other értéke :value.',
    'prohibited_if_accepted' => 'A(z) :attribute mező nem engedélyezett, ha :other el van fogadva.',
    'prohibited_if_declined' => 'A(z) :attribute mező nem engedélyezett, ha :other el van utasítva.',
    'prohibited_unless' => 'A(z) :attribute mező nem engedélyezett, hacsak :other nem a következők egyike: :values.',
    'prohibits' => 'A(z) :attribute mező miatt a(z) :other mező nem szerepelhet a kérésben.',
    'regex' => 'A(z) :attribute mező formátuma érvénytelen.',
    'required' => 'A(z) :attribute mező kitöltése kötelező.',
    'required_array_keys' => 'A(z) :attribute mezőnek tartalmaznia kell a következőket: :values.',
    'required_if' => 'A(z) :attribute mező kitöltése kötelező, ha :other értéke :value.',
    'required_if_accepted' => 'A(z) :attribute mező kitöltése kötelező, ha :other el van fogadva.',
    'required_if_declined' => 'A(z) :attribute mező kitöltése kötelező, ha :other el van utasítva.',
    'required_unless' => 'A(z) :attribute mező kitöltése kötelező, hacsak :other nem a következők egyike: :values.',
    'required_with' => 'A(z) :attribute mező kitöltése kötelező, ha :values jelen van.',
    'required_with_all' => 'A(z) :attribute mező kitöltése kötelező, ha :values jelen vannak.',
    'required_without' => 'A(z) :attribute mező kitöltése kötelező, ha :values nincs jelen.',
    'required_without_all' => 'A(z) :attribute mező kitöltése kötelező, ha a(z) :values egyike sincs jelen.',
    'same' => 'A(z) :attribute és a(z) :other mezőnek egyeznie kell.',
    'size' => [
        'array' => 'A(z) :attribute mezőnek :size elemet kell tartalmaznia.',
        'file' => 'A(z) :attribute mérete :size kilobájt kell legyen.',
        'numeric' => 'A(z) :attribute mező értéke :size kell legyen.',
        'string' => 'A(z) :attribute mező :size karakter hosszú kell legyen.',
    ],
    'starts_with' => 'A(z) :attribute mezőnek a következők egyikével kell kezdődnie: :values.',
    'string' => 'A(z) :attribute mezőnek szövegnek kell lennie.',
    'timezone' => 'A(z) :attribute mezőnek érvényes időzónának kell lennie.',
    'unique' => 'A(z) :attribute már foglalt.',
    'uploaded' => 'A(z) :attribute feltöltése nem sikerült.',
    'uppercase' => 'A(z) :attribute mező csak nagybetűket tartalmazhat.',
    'url' => 'A(z) :attribute mezőnek érvényes URL címnek kell lennie.',
    'ulid' => 'A(z) :attribute mezőnek érvényes ULID azonosítónak kell lennie.',
    'uuid' => 'A(z) :attribute mezőnek érvényes UUID azonosítónak kell lennie.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Messages for a single attribute + rule pair, named `attribute.rule`. A
    | `messages()` method on a FormRequest overrides these.
    |
    */

    'custom' => [
        'file' => [
            'max' => 'A feltöltött fájl legfeljebb 50 MB méretű lehet.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | Reader-friendly Hungarian names for the camelCase request keys the API
    | accepts, so a message reads "A megjelenő név mező …" instead of
    | "A displayName mező …".
    |
    */

    'attributes' => [
        'additionalContent' => 'további szöveg',
        'audience' => 'közönség',
        'category' => 'kategória',
        'categoryName' => 'kategória neve',
        'code' => 'kód',
        'displayName' => 'megjelenő név',
        'email' => 'email cím',
        'file' => 'fájl',
        'mainContent' => 'fő szöveg',
        'message' => 'üzenet',
        'name' => 'név',
        'newsletter' => 'hírlevél',
        'password' => 'jelszó',
        'publishedAt' => 'közzététel dátuma',
        'subject' => 'tárgy',
        'tag' => 'címke',
        'tags' => 'címkék',
        'title' => 'cím',
        'token' => 'token',
        'url' => 'URL cím',
        'version' => 'verzió',
    ],

];
