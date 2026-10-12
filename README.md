# Smiling Buddha — Supabase-kirjautuminen

## Käyttöönotto

Korvaa index.html, app.js, style.css ja assets-kansio tämän paketin tiedostoilla. Säilytä nykyinen GitHub Pagesin CNAME-tiedosto. Paketti toimii juuressa tai alihakemistossa; oma Supabase-projektisi osoite ja publishable-avain on jo asetettu.

Supabasen asetukset:
- Authentication / Sign In / Providers: Allow new users to sign up pois. Anonymous sign-ins pois. Email-kirjautuminen päälle.
- Oma käyttäjä luotu ja sähköposti vahvistettu.
- Authentication / URL Configuration / Site URL: https://smilingbuddha.dev/ (tai kirjautumissivun tarkka alihakemisto).
- Mahdolliset vahvistuslinkit käsittelee Supabase SDK. Salasanan palautus sivulta ei ole vielä toteutettu.

Paikallinen kokeilu: python3 -m http.server 8000 ja avaa http://localhost:8000. Älä avaa HTML:ää file://-osoitteena.

Kirjaudu Supabaseen luomallasi sähköpostiosoitteella ja salasanalla. Vanhat demo-tunnukset eivät toimi. Tarkista väärä salasana, oikea salasana, sivun päivittäminen ja uloskirjautuminen. Uloskirjautuminen koskee nykyistä selainta, ei kaikkia laitteita.

## Mitä toteutettiin

Supabase SDK 2.117.3 sisältyy paikalliseen assets/supabase-client.js-tiedostoon. Ei ulkoista CDN-skriptiä eikä julkaisuhetken build-vaihetta. SDK tarkistaa salasanan Supabasessa, tallentaa istunnon localStorageen ja uudistaa istuntotunnisteita. Palautettu istunto tarkistetaan myös getUser-kutsulla palvelimelta. Kirjautumistapahtumia seurataan myös eri välilehtien välillä. Verkkovirheistä näytetään ilmoitus.

Projektikortit ovat esittelyjä. Muistiinpanojen muokkausta tai tallennusta ei ole toteutettu. Julkaistu HTML on edelleen julkista, vaikka työtila näytetään vain kirjautuneelle. Yksityistä sisältöä ei saa lisätä HTML:ään: se tallennetaan myöhemmin tietokantaan palvelimen RLS-sääntöjen suojaamana. Julkinen avain ei yksin suojaa tietoja.

Tietosuojateksti kuvaa Supabase-yhteyden ja selaimen istuntotallennuksen. Salasanaa ei tallenneta sivun koodiin. Paketti ei sisällä secret- tai service_role-avainta. Automaattista rekisteröitymistä tai sähköpostin lähettämistä ei ole toteutettu.

## SDK:n rakentaminen uudelleen

build-source-kansiossa on package.json, package-lock.json ja client-entry.js. Aja kansiossa npm ci ja sitten:
npx esbuild client-entry.js --bundle --minify --format=iife --platform=browser --outfile=../assets/supabase-client.js

Fontti: Inter, SIL Open Font License 1.1, assets/Inter-OFL.txt. SDK:n ja riippuvuuksien lisenssit: THIRD-PARTY-LICENSES.txt.
