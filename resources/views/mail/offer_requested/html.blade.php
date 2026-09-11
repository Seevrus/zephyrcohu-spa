<x-mail.layout>
    <p>Tisztelt Zephyr Bt!</p>
    <p>A honlapon az alábbi árajánlatkérés érkezett be:</p>
    <p>Név: {{ $name }}</p>
    <p style="margin-top: 0;">Email cím: {{ $email }}</p>
    <p style="margin-top: 0;">Az ajánlatkérés tárgya: {{ $requestSubject }}</p>
    <p>Kérés:</p>
    <p style="margin-top: 0;">{{ $requestMessage  }}</p>
</x-mail.layout>
