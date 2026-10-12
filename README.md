# Smiling Buddha — yksityiset muistiinpanot

## 1. Luo taulu Supabaseen

Avaa oman projektisi SQL Editor. Luo uusi kysely, liitä sb-notes-setup.sql-tiedoston koko sisältö ja paina Run. Koodi luo sb_notes-taulun, käyttöoikeudet, neljä RLS-sääntöä ja versionumeron päivityksen. Aja asennus kerran. Jos taulu on jo olemassa, koodi epäonnistuu turvallisesti eikä poista sitä. Älä poista taulua virheen korjaamiseksi.

SQL ei lähetä sähköpostia eikä muuta kirjautumisasetuksia. Julkinen rekisteröityminen ja anonyymi kirjautuminen pidetään pois käytöstä.

## 2. Päivitä oikea GitHub-repositorio

Käytössä oleva sivusto: Begemotttt/begemotttt.github.io, main-haara, juurihakemisto.

Add file / Upload files: lataa index.html, app.js, style.css, notes.js, notes.css sekä koko assets-kansio. Säilytä nykyinen CNAME ja vanhat kuvat. SQL-tiedoston, build-source-kansion, README:n ja THIRD-PARTY-LICENSES.txt:n voi myös säilyttää repositoriossa. SQL-tiedosto ei sisällä tunnuksia eikä muistiinpanojen sisältöä. GitHub ei suorita sitä: se pitää ajaa Supabasessa erikseen.

Päivitä HTML ja molemmat JavaScript-tiedostot samassa commitissa. Vanhasta Supabase-paketista vain app.js:n tai notes.js:n lataaminen ei riitä.

## 3. Kokeile

Odota Actions-välilehdellä julkaisun valmistumista. Avaa https://smilingbuddha.dev/ ja tarvittaessa Ctrl+Shift+R. Kirjaudu omalla Supabase-tililläsi.

Avaa Muistiinpanot, valitse Uusi, kirjoita otsikko ja teksti, paina Tallenna. Päivitä sivu ja avaa muistiinpano uudelleen. Kokeile muokkausta ja poistamista ensin testimuistiinpanolla. Kokeile toisella laitteella samaa käyttäjätiliä: muistiinpano ladataan samasta tietokannasta.

Paikallinen testi: python3 -m http.server 8000 paketin hakemistossa ja http://localhost:8000. Paikallinen sivu käyttää samaa oikeaa Supabase-tietokantaa. Älä avaa HTML:ää file://-osoitteena.

## Tallentaminen

Ei automaattitallennusta. Tallentamattomat muutokset ovat vain sivun muistissa; sivun sulkeminen tai päivitys voi hukata ne. Sivu varoittaa ennen poistumista. Kirjautumisen päättyessä yksityiset tekstit poistetaan sivun muistista. Palvelimelle tallennetut muistiinpanot säilyvät.

Enimmäispituudet: otsikko 200 merkkiä, teksti 100 000 merkkiä. Sisältö on tavallista tekstiä: Markdownia voi kirjoittaa, mutta HTML:ää tai Markdownia ei renderöidä. Luettelo on jaettu 50 muistiinpanon sivuihin.

Tallennus ja poisto tarkistavat rivin versionumeron. Toisella laitteella tehtyä uudempaa versiota ei ylikirjoiteta. Ristiriitatilanteessa omat muutokset säilyvät editorissa: kopioi ne tarvittaessa talteen ja lataa palvelimen versio.

Jos tallennuksen tai poiston vastaus katoaa, tulos näytetään epävarmana. Sivu ei toista kirjoitusta automaattisesti. Tarkista tallennuksen tila -painike tekee vain lukupyynnön. Muistiinpanon UUID pysyy samana epäonnistuneen uuden muistiinpanon uudelleenyrityksessä, jotta samaa luontia ei vahingossa monisteta.

## Käyttöoikeudet

Vain authenticated-rooli saa käyttää taulua. Jokainen SELECT, INSERT, UPDATE ja DELETE rajataan auth.uid() = user_id -säännöllä. Anonyymillä vierailijalla ei ole tauluoikeuksia. Selaimessa on vain publishable-avain; secret/service_role-avainta ei ole. Julkinen sivun lähdekoodi ei sisällä käyttäjän muistiinpanoja. Supabasen ylläpitäjä voi silti nähdä tiedot: tämä ei ole päästä päähän salattu holvi.

Varmuuskopiointi ja palautusversiot eivät sisälly tähän toteutukseen. Poisto on pysyvä, eikä roskakoria ole.

## Tarkistukset

Käyttöliittymä testattiin oikealla Supabase SDK:lla ja simuloiduilla API-vastauksilla. Testit kattavat luomisen, muokkauksen, poiston, epävarman kirjoituksen varmennuksen ilman monistamista, versiokonfliktin, verkkovirheen ja kirjautumisen päättymisen myöhäisen vastauksen aikana. SQL suoritettiin eristetyssä PostgreSQL/PGlite-ympäristössä: omat CRUD-operaatiot sallitaan, anonyymi ja toinen käyttäjä estetään, omistajan väärentäminen estetään ja versionumerot toimivat. Oikean Supabase-projektin SQL-asennus ja todellinen käyttäjätesti tehdään yllä kuvatuilla vaiheilla.

## SDK ja lisenssit

SDK 2.117.3 on assets/supabase-client.js-tiedostossa. Ei ulkoista CDN-skriptiä. Muistiinpanojen moduuli käyttää samaa SDK:ta.

build-source-kansion package.json, package-lock.json ja client-entry.js mahdollistavat SDK:n rakentamisen uudelleen: npm ci, sitten npx esbuild client-entry.js --bundle --minify --format=iife --platform=browser --outfile=../assets/supabase-client.js.

Inter-fontin lisenssi: assets/Inter-OFL.txt. SDK ja riippuvuudet: THIRD-PARTY-LICENSES.txt.
