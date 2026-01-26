<div>
    <div style="border-bottom: 3px solid rgb(0, 0, 128);">
        <img style="height: 4rem;" src="https://zephyr.co.hu/img/logo/logo.png" alt="Zephyr Bt. Logo">
    </div>
    <div style="background-color: rgb(207, 231, 245); padding: 1rem; font-family: sans-serif; font-size: 14px;">
        <p>Tisztelt Felhasználónk!</p>
        <p>Ezt a levelet Ön azért kapta, mert ezt az új e-mail címet adta meg adatainak módosításakor: {{ $email }}.</p>
        <p>Jelenleg még a korábbi email címe szerepel az adatbázisunkban. Kérjük, <a
                    href="https://zephyr.co.hu/profil/email_frissit?email={{ urlencode($email) }}&code={{ urlencode($code) }}"
                    style="color: rgb(51, 51, 51); text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); background-color: rgba(245, 245, 245, 1);">kattintson
                ide</a> <strong>az új email cím aktiválásához</strong>.</p>
        <p>Amennyiben nem Ön módosította az email címét, kérjük válasz emailben jelezze felénk a problémát!</p>
        <p style="margin-bottom: 0;">Tisztelettel,</p>
        <p style="margin-top: 0;">Zephyr Számítástechnikai Fejlesztő és Gazdasági Szolgáltató Bt.</p>
    </div>
</div>
