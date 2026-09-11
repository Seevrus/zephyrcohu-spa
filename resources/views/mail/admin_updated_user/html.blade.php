<x-mail.layout>
    <p>Tisztelt Felhasználónk!</p>
    <p>Ezt a levelet azért küldjük, mert az alábbi adatait módosítottuk a rendszerünkben:</p>
    <ul>
        @foreach ($modifiedItems as $item)
            <li>{{ $item }}</li>
        @endforeach
    </ul>
    <p>Amennyiben bármilyen kérdése merülne fel, kérjük vegye fel velünk a kapcsolatot az <a
                href="mailto:info@zephyr.co.hu"
                style="color: rgb(51, 51, 51); text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); background-color: rgba(245, 245, 245, 1);">info@zephyr.co.hu</a>
        címen.</p>
    <p style="margin-bottom: 0;">Tisztelettel,</p>
    <p style="margin-top: 0;">Zephyr Számítástechnikai Fejlesztő és Gazdasági Szolgáltató Bt.</p>
</x-mail.layout>
