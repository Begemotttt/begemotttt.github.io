# Smiling Buddha — varmuuskopio ja idealista

## 1. Päivitä olemassa oleva tietokanta

Projektit ja muistiinpanot ovat jo käytössä. Avaa Supabasen SQL Editor, luo uusi kysely, liitä sb-ideas-backup-setup.sql:n koko sisältö ja paina Run kerran.

Päivitys lisää muistiinpanoihin is_idea-valinnan ja omistajan tietoja lukevan varmuuskopiotoiminnon. Nykyiset tiedot säilyvät. Älä aja vanhoja sb-notes-setup.sql- tai sb-projects-setup.sql-tiedostoja uudelleen. Ne ovat mukana vain tyhjää asennusta varten; siinä järjestys on notes, projects, ideas-backup. Toistettu uusi päivitys epäonnistuu turvallisesti eikä poista tietoja.

## 2. Päivitä oikea GitHub-repositorio

Käytössä oleva sivusto: Begemotttt/begemotttt.github.io, main-haara, juurihakemisto.

Add file / Upload files: lataa index.html, app.js, style.css, notes.js, projects.js, workspace-tools.js, notes.css sekä koko assets-kansio. Säilytä nykyinen CNAME ja vanhat kuvat. SQL-tiedoston, build-source-kansion, README:n ja THIRD-PARTY-LICENSES.txt:n voi myös säilyttää repositoriossa. SQL-tiedosto ei sisällä tunnuksia eikä muistiinpanojen sisältöä. GitHub ei suorita sitä: se pitää ajaa Supabasessa erikseen.

Päivitä HTML ja kaikki JavaScript-tiedostot samassa commitissa. Vanhasta Supabase-paketista vain app.js:n tai notes.js:n lataaminen ei riitä.

## Projektien käyttö

Avaa Projektit, valitse Uusi, kirjoita nimi ja kuvaus, paina Tallenna. Projektilla on oma ”Avaa projektin muistiinpanot” -painike. Se avaa muistiinpanojen luettelon rajattuna tähän projektiin.

Muistiinpanoeditorissa Projekti-valikko liittää tai siirtää muistiinpanon valittuun projektiin. Valitse ”Ilman projektia”, jos haluat irrottaa liitoksen. Valinnan muutos tallennetaan Tallenna-painikkeella. Muistiinpanojen luettelossa voi näyttää kaikki muistiinpanot, projektin muistiinpanot tai ilman projektia olevat.

Projektin nimi on enintään 200 merkkiä ja kuvaus 5 000 merkkiä. Projektit ja muistiinpanot toimivat samoin: manuaalinen tallennus, version tarkistus, epävarman kirjoituksen lukupohjainen varmennus, poiston vahvistus ja yksityisten tekstien tyhjennys kirjautumisen päättyessä.

Projektia ei voi poistaa, jos siihen on liitetty muistiinpanoja. Siirrä tai irrota muistiinpanot ensin ja tallenna muutokset. Projektin poistaminen ei poista muistiinpanoja.

## 3. Kokeile

Odota Actions-välilehdellä julkaisun valmistumista. Avaa https://smilingbuddha.dev/ ja tarvittaessa Ctrl+Shift+R. Kirjaudu omalla Supabase-tililläsi.

Avaa Muistiinpanot, valitse Uusi, kirjoita otsikko ja teksti, paina Tallenna. Päivitä sivu ja avaa muistiinpano uudelleen. Kokeile muokkausta ja poistamista ensin testimuistiinpanolla. Kokeile toisella laitteella samaa käyttäjätiliä: muistiinpano ladataan samasta tietokannasta.

Paikallinen testi: python3 -m http.server 8000 paketin hakemistossa ja http://localhost:8000. Paikallinen sivu käyttää samaa oikeaa Supabase-tietokantaa. Älä avaa HTML:ää file://-osoitteena.

## Tallentaminen

Ei automaattitallennusta. Tallentamattomat muutokset ovat vain sivun muistissa; sivun sulkeminen tai päivitys voi hukata ne. Sivu varoittaa ennen poistumista. Kirjautumisen päättyessä yksityiset tekstit poistetaan sivun muistista. Palvelimelle tallennetut muistiinpanot säilyvät.

Enimmäispituudet: otsikko 200 merkkiä, teksti 100 000 merkkiä. Sisältö tallennetaan tavallisena tekstinä. Esikatselu näyttää Markdownin turvallisesti suodatettuna; kuvat, skriptit ja upotukset poistetaan. Verkko-osoitteet avautuvat erilliseen välilehteen. Luettelo on jaettu 50 muistiinpanon sivuihin.

Tallennus ja poisto tarkistavat rivin versionumeron. Toisella laitteella tehtyä uudempaa versiota ei ylikirjoiteta. Ristiriitatilanteessa omat muutokset säilyvät editorissa: kopioi ne tarvittaessa talteen ja lataa palvelimen versio.

Jos tallennuksen tai poiston vastaus katoaa, tulos näytetään epävarmana. Sivu ei toista kirjoitusta automaattisesti. Tarkista tallennuksen tila -painike tekee vain lukupyynnön. Muistiinpanon tai projektin UUID pysyy samana epäonnistuneen uuden muistiinpanon uudelleenyrityksessä, jotta samaa luontia ei vahingossa monisteta.

## Käyttöoikeudet

Vain authenticated-rooli saa käyttää taulua. Molemmissa tauluissa jokainen SELECT, INSERT, UPDATE ja DELETE rajataan auth.uid() = user_id -säännöllä. Anonyymillä vierailijalla ei ole tauluoikeuksia. Selaimessa on vain publishable-avain; secret/service_role-avainta ei ole. Julkinen sivun lähdekoodi ei sisällä käyttäjän muistiinpanoja. Supabasen ylläpitäjä voi silti nähdä tiedot: tämä ei ole päästä päähän salattu holvi.

JSON-varmuuskopion vienti sisältyy toteutukseen. Automaattista palautusta, versiohistoriaa tai roskakoria ei vielä ole; poisto on pysyvä.

## Tarkistukset

Käyttöliittymä testattiin oikealla Supabase SDK:lla ja simuloiduilla API-vastauksilla. Testit kattavat luomisen, muokkauksen, poiston, epävarman kirjoituksen varmennuksen ilman monistamista, versiokonfliktin, verkkovirheen ja kirjautumisen päättymisen myöhäisen vastauksen aikana. SQL suoritettiin eristetyssä PostgreSQL/PGlite-ympäristössä: omat CRUD-operaatiot sallitaan, anonyymi ja toinen käyttäjä estetään, omistajan väärentäminen estetään ja versionumerot toimivat. Oikean Supabase-projektin SQL-asennus ja todellinen käyttäjätesti tehdään yllä kuvatuilla vaiheilla.

Projektipäivityksen testit: PostgreSQL/PGlite varmisti vanhojen muistiinpanojen säilymisen, molempien taulujen käyttöoikeudet, väärän omistajan estämisen, omistajan sisältävän viiteavaimen toiminnan, muistiinpanojen siirtämisen ja projektin poiston estämisen silloin kun siinä on muistiinpanoja. Käyttöliittymä testattiin oikealla SDK:lla ja simuloiduilla vastauksilla: projektien luominen/muokkaus/poisto, epävarman projektitallennuksen varmennus ilman monistamista, muistiinpanojen liittäminen/irrottaminen/rajaaminen sekä vanhan muistiinpanotoiminnon regressiot.

## SDK ja lisenssit

SDK 2.117.3 on assets/supabase-client.js-tiedostossa. Ei ulkoista CDN-skriptiä. Muistiinpanojen moduuli käyttää samaa SDK:ta.

build-source-kansion package.json, package-lock.json ja client-entry.js mahdollistavat SDK:n rakentamisen uudelleen: npm ci, sitten npx esbuild client-entry.js --bundle --minify --format=iife --platform=browser --outfile=../assets/supabase-client.js.

Inter-fontin lisenssi: assets/Inter-OFL.txt. SDK ja riippuvuudet: THIRD-PARTY-LICENSES.txt.

## Idealista ja Markdown

Idealista näkyy etusivulla otsikkotekstien vieressä, puhelimessa niiden alla. Se näyttää kymmenen viimeksi päivitetyn idean otsikot ilman erillistä korttia. Otsikko avaa Ideat-osion ja valitun idean muokattavaksi. Uusi idea avaa editorin valmiiksi merkittynä ideaksi; kirjoita otsikko ja sisältö ja paina Tallenna. Kaikki ideat avaa Ideat-osion.

Myös olemassa olevan muistiinpanon voi merkitä valinnalla ”Näytä idealistassa” ja tallentaa. Idean voi liittää projektiin. Muokkaa / Esikatselu vaihtaa näkymää. Lataa .md tallentaa editorin nykyisen otsikon ja tekstin Markdown-tiedostoon, myös tallentamattomat muutokset. Palvelimella ideat ovat samoja muistiinpanoja, eivät erillisiä tiedostoliitteitä.

## Varmuuskopio

Yläpalkin Lataa varmuuskopio lataa JSON-tiedoston, jossa ovat kaikki kirjautuneen käyttäjän palvelimelle tallennetut projektit ja muistiinpanot, idea-valinnat, projektien liitokset sekä aikaleimat ja versiot. Vienti tehdään yhtenä palvelimen lukutoimintona ja sisältää myös yli tuhannen rivin aineiston. Tiedostoon ei sisälly salasanoja tai kirjautumistunnuksia.

Tallenna editorin muutokset ensin. JSON-vienti ei sisällä keskeneräistä editoritekstiä. Epäonnistuneesta viennistä ei ladata osittaista tiedostoa. Varmuuskopio on salaamatonta tekstiä; säilytä lataamasi tiedosto omassa tallessa. Palautus käyttöliittymän kautta ei vielä ole toteutettu.

## Uuden päivityksen tarkistukset

PostgreSQL/PGlite-testit: vanhojen tietojen säilyminen, ideavalinnan päivitys, täydellinen 1006 muistiinpanon vienti, projektien liitokset ja toisen käyttäjän/anonyymin pääsyn esto. Käyttöliittymätestit jsdomissa oikealla SDK:lla ja simuloidulla API:lla: idealistan avaus, turvallinen Markdown, MD- ja JSON-lataus, vientivirheet ja kirjautumisen päättyminen kesken viennin sekä aiemmat projekti- ja muistiinpanotoiminnot. Todellisen sivun ulkoasu ja Supabase-asennus tarkistetaan julkaisun jälkeen.

## Markdown-kirjastot ja rakentaminen

Marked 18.1.1 ja DOMPurify 3.4.17 ovat paikallisessa assets/markdown.js-tiedostossa. Lähteet ja lukittu riippuvuusluettelo: build-source/markdown. Rakennus kyseisessä kansiossa: npm ci, sitten npx esbuild entry.js --bundle --minify --format=iife --platform=browser --outfile=../../assets/markdown.js. Lisenssit: THIRD-PARTY-LICENSES.txt.

## Välimuistipäivitys

HTML käyttää CSS- ja JavaScript-tiedostoille sisältöön perustuvia versiotunnisteita. Lataa kaikki päivityksen tiedostot samassa commitissa, odota Pages-julkaisua ja päivitä sivu tarvittaessa Ctrl+Shift+R.

Tämä ulkoasu- ja navigointikorjaus ei tarvitse uutta SQL-päivitystä, jos sb-ideas-backup-setup.sql on jo ajettu.
