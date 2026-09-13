<x-mail.layout>
    <p>Jelenleg az alábbi felhasználók regisztrációja vár megerősítésre:</p>
    <ul>
        @foreach ($pendingEmails as $email)
            <li>{{ $email }}</li>
        @endforeach
    </ul>
</x-mail.layout>
