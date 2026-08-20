<div>
    <div style="border-bottom: 3px solid rgb(0, 0, 128);">
        <img style="height: 4rem;" src="https://zephyr.co.hu/img/logo/logo.png" alt="Zephyr Bt. Logo">
    </div>
    <div style="background-color: #d7e3ff; padding: 1rem; font-family: sans-serif; font-size: 14px;">
        <p>Tisztelt Zephyr Bt!</p>
        <p>A honlapon az alábbi árajánlatkérés érkezett be:</p>
        <p>Név: {{ $name }}</p>
        <p style="margin-top: 0;">Email cím: {{ $email }}</p>
        <p style="margin-top: 0;">Az ajánlatkérés tárgya: {{ $requestSubject }}</p>
        <p>Kérés:</p>
        <p style="margin-top: 0;">{{ $requestMessage  }}</p>
    </div>
</div>
