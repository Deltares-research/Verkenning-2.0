# Handleiding Dijkontwerper Verkenning 2.0 Proof Of Concept

Deze pagina geeft een beknopte gebruikershandleiding bij de Dijkontwerper gemaakt als onderdeel van project Verkenning 2.0. Dit betreft een proof of concept wat verder wordt doorontwikkeld. Het gebruik van de belangrijkste functionaliteiten is hier toegelicht. Voor meer inhoudelijke details wordt verwezen naar de technische documentatie [hier komt een link].

## Inhoudsopgave

1. [Opstarten](#opstarten)
2. [Zijbalk: projectbeheer](#zijbalk-projectbeheer)
3. [Dimensioneer grondlichaam](#tab-1-dimensioneer-grondlichaam)
4. [Dimensioneer constructie (Opbouwen in 3D)](#tab-2-dimensioneer-constructie-opbouwen-in-3d)
5. [Effecten](#tab-3-effecten)
6. [Kosten](#tab-4-kosten)
7. [Afwegen](#tab-5-afwegen)
8. [Kaartinteractie en lagen](#kaartinteractie-en-lagen)

---

## Opstarten

Bij het openen van de applicatie verschijnt een welkomstdialoog met drie opties:

- **Ik wil een schets maken** — start direct met een snelle schets, zonder ontwerp-naam in te vullen.
- **Nieuw ontwerp maken** — opent een dialoog om een ontwerp-naam in te stellen (formaat: `vak - alternatief`).
- **Ontwerp laden (lokaal)** — laad een eerder opgeslagen project (JSON-bestand) van je eigen computer.

Na het aanmaken of laden van een ontwerp verschijnt linksboven de naam: *"Ontwerp: [naam]"*.

---

## Zijbalk: projectbeheer

Aan de linkerkant zit een inklapbare zijbalk met de volgende knoppen:

| Knop | Omschrijving |
|------|-------------|
| **Lokaal bestand laden** | Laad een eerder opgeslagen project (JSON) van je computer. |
| **Project lokaal opslaan** | Sla het huidige project lokaal op als JSON-bestand. |
| **Designnaam wijzigen** | Pas de naam van het ontwerp aan (vak en alternatief). |
| **Geodata downloaden** | Exporteer onderdelen van het ontwerp als losse bestanden (GeoJSON). Je kunt kiezen welke onderdelen je wilt downloaden: invoerlijn, 3D ontwerpdata, 2D ontwerpdata, 2D ruimtebeslag, constructielijn. |
| **Alles wissen** | Verwijdert alle data: lijn, uitrol, constructie en berekeningen. |

Onderin de zijbalk staat een statusindicator:

- Groen: *"Alles berekend"* — effecten en kosten zijn beide berekend.
- Geel: *"Gedeeltelijk"* — alleen effecten zijn berekend.
- Rood: *"Niet berekend"* — er zijn nog geen berekeningen uitgevoerd.

Door over de indicator heen te gaan wordt aangegeven waarom deze bijv. rood is.

---

## Dimensioneer grondlichaam

In dit tabblad kan in drie stappen een dijklichaam (grondlichaam) worden ontworpen.

### Stap 1: Referentielijn bepalen

De referentielijn is de as-lijn van de dijk. Er zijn drie manieren om deze te bepalen:

- **Teken lijn** — teken de lijn direct op de kaart door te klikken. Dubbelklik om de lijn af te ronden.
- **Upload GeoJSON** — upload een bestaande lijn als GeoJSON-bestand.
- **Selecteer uit kaart** — klik op een bestaande lijn in de kaart om deze over te nemen. Kies eerst de laag waaruit je wilt selecteren via het dropdown-menu.

Met **Verwijder lijn** verwijder je de huidige referentielijn.

### Stap 2: Dwarsprofiel bepalen

Klik op **Open 2D-ontwerpen** om het ontwerp-paneel te openen. Hier zie je:

- Een **grafiek** Dwarsprofiel met daarin het dwarsprofiel visueel weergegeven (hoogte vs. afstand tot de referentielijn).
- Een **tabel** Invoerdata waarin je punten kunt toevoegen, bewerken of verwijderen. Elk punt heeft:
  - *Locatie* — naam van het profielpunt (bijv. buitenteen, buitenkruin, binnenkruin, binnenteen).
  - *Afstand (m)* — horizontale afstand tot de referentielijn.
  - *Hoogte (m NAP)* — hoogte ten opzichte van NAP.
  - *Talud* — geeft het talud tussen 2 punten weer
  - *Acties* — ...?

Na het invullen wordt het dwarsprofiel automatisch over de hele lengte van de referentielijn uitgerold tot een 3D-model op de kaart.

Met **Verwijder uitrol** verwijder je het huidige dwarsprofiel en het 3D-model.

### Stap 3: Controleren dwarsprofiel

Klik op **Controleer dwarsprofiel** om een doorsnede-weergave te openen. Hiermee kun je visueel controleren of het ontworpen profiel klopt ten opzichte van het bestaande maaiveld. Dit kan gedaan worden door een willekeurige lijn te tekenen. In de doorsnede-weergave wordt dan het AHN4 en het ontwerpprofiel samen weergegeven.

> [!TIP]
> Omdat bij het maken van een profiel 1 doorsnede wordt gebruikt is het goed om visueel te controleren of dit profiel ook voor de rest van het dijkvak logisch is.


### Ontwerp overzicht

Onderaan het tabblad staat een tabel met berekende waarden. Deze worden berekend middels de backend tooling. De onderliggende bepalingen zijn verder beschreven in de technische documentatie.

| Waarde | Eenheid |
|--------|---------|
| Lengte traject | m |
| Volumeverschil | m³ |
| Uitgraven | m³ |
| Opvullen | m³ |
| 2D Oppervlakte | m² |
| 3D Oppervlakte | m² |

---

## Dimensioneer constructie (Opbouwen in 3D)

In dit tabblad kan constructie toegevoegd worden aan het ontwerp, zoals een damwand of heavescherm.

**Let op:** er moet eerst een referentielijn zijn getekend in Tab 1. Als deze ontbreekt verschijnt een waarschuwing.

### Stap 1: Constructielijn bepalen

De constructielijn bepaalt waar de constructie in de dijk komt. Net als bij de referentielijn zijn er drie opties:

- **Teken lijn** — teken de constructielijn op de kaart.
- **Upload GeoJSON** — upload een bestaand GeoJSON-bestand.
- **Selecteer uit kaart** — selecteer een bestaande lijn uit de kaart.

### Stap 2: Constructie parameters

Stel de eigenschappen van de constructie in:

- **Type constructie** — keuze uit:
  - *Heavescherm*
  - *Verankerde damwand*
  - *Onverankerde damwand*

- **Onderkant constructie t.o.v. NAP (m)** — de diepte van de onderkant van de constructie, uitgedrukt in meters ten opzichte van NAP.

- **Gebruik offset** — optioneel. Wanneer aangevinkt verschijnen twee extra velden:
  - *Offset afstand (m)* — de afstand van de constructie tot de referentielijn.
  - *Offset zijde* — links of rechts van de referentielijn.


> [!TIP] 
> Let op de door de pijl aangegeven richting van de referentielijn bij het bepalen van de offset zijde

Er zijn in principe geen restricties waar een constructie gedefinieerd kan worden, bijvoorbeeld limieten aan vakgrenzen of de locatie ten opzichte van het grondprofiel. Dit is de verantwoordelijkheid van de gebruiker.

### Stap 3: Maak constructie

- **Maak constructie** — genereert de constructie op de kaart op basis van de ingevoerde parameters. De constructie wordt als lijn weergegeven op of parallel aan de constructielijn.
- **Verwijder constructie** — verwijdert de constructie van de kaart.

---

## Effecten

In deze tab analyseer je de ruimtelijke effecten van het ontwerp op de omgeving. Bovenaan staat aangegeven welke onderdelen worden meegenomen (grondlichaam en/of constructie met bufferzone daaromheen).

### Analyse uitvoeren

Klik op **Voer effectenanalyse uit** om de analyse te starten. De applicatie berekent welke objecten en gebieden binnen het ruimtebeslag van het ontwerp vallen.

### Resultaten

De resultaten zijn opgedeeld in vier categorieen:

**Wonen en leefomgeving**
- BAG panden (aantal en oppervlakte)
- Invloedzone BAG panden
- Percelen die geen eigendom zijn van het waterschap
- Erven

**Natuur**
- Natura 2000-gebieden
- Gelders Natuur Netwerk (GNN)
- NBP beheertypen

**Verkeer**
- BGT wegdelen (oppervlakte)
- BGT afritten (oppervlakte en aantal)

**Uitvoering** (objecten binnen de uitvoeringsbuffer)
- Wegoppervlak in uitvoeringszone
- Panden, percelen, natuurgebieden binnen de invloedscontour

Bij elke rij kun je via het optiemenu de bijbehorende kaartlaag aan- of uitzetten om de relevante laag op de kaart te bekijken (bijv. BGT of BAG). 

Voor de uitvoeringsaspecten wordt om zowel het grondlichaam als de constructie een buffer van 10 meter gemaakt en vervolgens worden deze samengevoegd. De aanwezige effecten worden dan voor die gezamenlijke zone weergegeven.


### Exporteren

Klik op **Download effectenoverzicht (Excel)** om de resultaten te exporteren naar een Excel-bestand.

---

## Tab 4: Kosten

In deze tab bereken je een indicatieve kostenraming voor het ontwerp.

**Voorwaarde:** de effectenanalyse (Tab 3) moet eerst zijn uitgevoerd.

### Kostenberekening

1. Selecteer de **complexiteit van de maatregel** via het dropdown-menu.
2. Klik op **Bereken kosten**.

> [!TIP]
> De complexiteit slaat op de complexiteit van de uitvoering van de maatregelen. Bij een complexe dijkversterking worden hogere opslagfactoren gehanteerd voor bijvoorbeeld engineering en risico. Zie voor meer informatie de technische documentatie.

### Resultaten bekijken

- **Toon kostenoverzicht & grafieken** — opent een paneel met een gedetailleerde kostentabel en bijbehorende grafieken.

De kostenopbouw bevat onder andere:
- Bouwkosten
- Engineeringkosten
- Overige bijkomende kosten
- Vastgoedkosten
- Subtotaal en totaal (excl. en incl. BTW)

> [!TIP]
> Door bij het paneel kostenoverzicht rechtsboven op het vierkantje te klikken kan deze worden vergroot, en zijn de grafieken beter zichtbaar.

In het kostenoverzicht zijn 3 tabbladen gegeven:
* **Overzicht** geeft een uitklapbare kostenopsplitsing van de verschillende kostencomponenten van de dijkversterking. Door subposten uit te klappen kunnen de deelkosten worden weergegeven.
* **Kostenverdeling** geeft een taartdiagram van de verschillende kostencomponenten. Door op de linkertaart een andere post te selecteren wordt deze in het rechterdiagram verder uitgesplitst.
* **Kostenbereik** geeft als aanvulling op de andere schermen een onder- en bovengrens van de kostenschatting. Deze is nu gebaseerd op een eenvoudige variatie van 10%, maar kan in de toekomst worden gebruikt om de onzekerheid in kostenramingen beter weer te geven.

### Exporteren
De resultaten en invoer van de kostenberekening kunnen ook worden geexporteerd. 
- **Download kostenoverzicht (Excel)** — exporteert de kostentabel inclusief alle gebruikte hoeveelheden en eenheidsprijzen naar Excel.
- **Download kentallen (.csv)** — exporteert de gebruikte kentallen (eenheidsprijzen en opslagfactoren) als CSV (2 losse bestanden). Deze zijn in het format zoals gebruikt in de kostenberekening. Hoe de opslagfactoren en eenheidsprijzen worden gebruikt is beschreven in de technische documentatie.

---

## Tab 5: Afwegen

In het tabblad *Afwegen* kun je meerdere ontwerp-varianten met elkaar vergelijken.

Elk opgeslagen ontwerp verschijnt als kolom in de vergelijkingstabel. Het paneel opent onderin het scherm en kan gemaximaliseerd worden.

### Vergelijkingstabel

De tabel toont per ontwerp:

**Ontwerpwaarden** — trajectlengte, volumes, oppervlaktes.

**Constructie** — type, diepte, offset-instellingen van eventueel toegepaste constructies.

**Kosten** — Totale kosten opgesplitst in hoofdcategorieen (bouwkosten, engineering, vastgoed, totalen).

**Effecten** — Effecten zoals bepaald voor wonen & leefomgeving, natuur, verkeer, uitvoering.

### Grafieken

Via de sub-tab **Grafieken** worden de effecten en kosten van alternatieven ook in grafiekvorm weergegeven.

---

## Kaartinteractie en lagen

De kaart is een 3D-weergave (SceneView) met de volgende interactiemogelijkheden:

- **Navigeren** — sleep om te pannen, scroll om te zoomen, rechtermuisknop om te draaien/kantelen.
- **Lagen** — via het lagenpaneel (rechts) kun je individuele lagen aan- en uitzetten, waaronder:
  - Dijklichaam 3D (mesh)
  - Ruimtebeslag 3D
  - Ruimtebeslag 2D
  - Constructie
  - Referentielijn en constructielijn
  - Achtergrondlagen (luchtfoto, topografie, etc.)

---

*Dit document beschrijft de huidige functionaliteit. De applicatie is in actieve ontwikkeling; het is een Proof of Concept (POC).*
