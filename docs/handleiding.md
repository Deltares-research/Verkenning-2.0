# Handleiding Dijkontwerp Verkenning 2.0 POC

## Inhoudsopgave

1. [Opstarten](#opstarten)
2. [Zijbalk: projectbeheer](#zijbalk-projectbeheer)
3. [Tab 1: Dimensioneer grondlichaam](#tab-1-dimensioneer-grondlichaam)
4. [Tab 2: Dimensioneer constructie (Opbouwen in 3D)](#tab-2-dimensioneer-constructie-opbouwen-in-3d)
5. [Tab 3: Effecten](#tab-3-effecten)
6. [Tab 4: Kosten](#tab-4-kosten)
7. [Tab 5: Afwegen](#tab-5-afwegen)
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
| **Laden** | Laad een eerder opgeslagen project (JSON) van je computer. |
| **Opslaan** | Sla het huidige project lokaal op als JSON-bestand. |
| **Titel wijzigen** | Pas de ontwerp-naam aan (vak en alternatief). |
| **Downloaden** | Exporteer onderdelen van het ontwerp als losse bestanden (GeoJSON). Je kunt kiezen welke onderdelen je wilt downloaden: invoerlijn, 3D ontwerpdata, 2D ontwerpdata, 2D ruimtebeslag, constructielijn. |
| **Wis alles** | Verwijdert alle data: lijn, uitrol, constructie en berekeningen. |

Onderin de zijbalk staat een statusindicator:

- Groen: *"Alles berekend"* — effecten en kosten zijn beide berekend.
- Geel: *"Gedeeltelijk"* — alleen effecten zijn berekend.
- Rood: *"Niet berekend"* — er zijn nog geen berekeningen uitgevoerd.

---

## Tab 1: Dimensioneer grondlichaam

In deze tab ontwerp je het dijklichaam (grondlichaam) in drie stappen.

### Stap 1: Referentielijn bepalen

De referentielijn is de as-lijn van de dijk. Er zijn drie manieren om deze te bepalen:

- **Teken lijn** — teken de lijn direct op de kaart door te klikken. Dubbelklik om de lijn af te ronden.
- **Upload GeoJSON** — upload een bestaande lijn als GeoJSON-bestand.
- **Selecteer uit kaart** — klik op een bestaande lijn in de kaart om deze over te nemen. Kies eerst de laag waaruit je wilt selecteren via het dropdown-menu.

Met **Verwijder lijn** verwijder je de huidige referentielijn.

### Stap 2: Dwarsprofiel bepalen

Klik op **Open 2D-ontwerpen** om het ontwerp-paneel te openen. Hier zie je:

- Een **grafiek** met het dwarsprofiel (hoogte vs. afstand tot de referentielijn).
- Een **tabel** waarin je punten kunt toevoegen, bewerken of verwijderen. Elk punt heeft:
  - *Locatie* — naam van het profielpunt (bijv. buitenteen, buitenkruin, binnenkruin, binnenteen).
  - *Afstand (m)* — horizontale afstand tot de referentielijn.
  - *Hoogte (m NAP)* — hoogte ten opzichte van NAP.
  - *Rivierzijde* — geeft aan of het punt links of rechts van de referentielijn ligt.

Na het invullen wordt het dwarsprofiel automatisch over de hele lengte van de referentielijn uitgerold tot een 3D-model op de kaart.

Met **Verwijder uitrol** verwijder je het huidige dwarsprofiel en het 3D-model.

### Stap 3: Controleren dwarsprofiel

Klik op **Controleer dwarsprofiel** om een doorsnede-weergave te openen. Hiermee kun je visueel controleren of het ontworpen profiel klopt ten opzichte van het bestaande maaiveld.

### Ontwerp overzicht

Onderaan de tab staat een tabel met berekende waarden:

| Waarde | Eenheid |
|--------|---------|
| Lengte traject | m |
| Volumeverschil | m³ |
| Uitgraven | m³ |
| Opvullen | m³ |
| 2D Oppervlakte | m² |
| 3D Oppervlakte | m² |

---

## Tab 2: Dimensioneer constructie (Opbouwen in 3D)

In deze tab voeg je een constructie toe aan het ontwerp, zoals een damwand of heavescherm. Dit is de "Opbouwen in 3D"-functionaliteit.

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

### Stap 3: Maak constructie

- **Maak constructie** — genereert de 3D-constructie op de kaart op basis van de ingevoerde parameters. De constructie wordt als verticaal vlak weergegeven langs de constructielijn.
- **Verwijder constructie** — verwijdert de constructie van de kaart.

---

## Tab 3: Effecten

In deze tab analyseer je de ruimtelijke effecten van het ontwerp op de omgeving. Bovenaan staat aangegeven welke onderdelen worden meegenomen (grondlichaam en/of constructie met buffer).

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

Bij elke rij kun je via het optiemenu de bijbehorende kaartlaag aan- of uitzetten om de resultaten op de kaart te bekijken.

### Exporteren

Klik op **Download effectenoverzicht (Excel)** om de resultaten te exporteren naar een Excel-bestand.

---

## Tab 4: Kosten

In deze tab bereken je een indicatieve kostenraming voor het ontwerp.

**Voorwaarde:** de effectenanalyse (Tab 3) moet eerst zijn uitgevoerd.

### Kostenberekening

1. Selecteer de **complexiteit van de maatregel** via het dropdown-menu.
2. Klik op **Bereken kosten**.

### Resultaten bekijken

- **Toon kostenoverzicht & grafieken** — opent een paneel met een gedetailleerde kostentabel en bijbehorende grafieken.

De kostenopbouw bevat onder andere:
- Bouwkosten
- Engineeringkosten
- Overige bijkomende kosten
- Vastgoedkosten
- Subtotaal en totaal (excl. en incl. BTW)

### Exporteren

- **Download kostenoverzicht (Excel)** — exporteert de kostentabel naar Excel.
- **Download kentallen (.csv)** — exporteert de gebruikte kentallen (eenheidsprijzen) als CSV.

---

## Tab 5: Afwegen

In deze tab kun je meerdere ontwerp-varianten naast elkaar vergelijken.

Elk opgeslagen ontwerp verschijnt als kolom in de vergelijkingstabel. Het paneel opent onderin het scherm en kan gemaximaliseerd worden.

### Vergelijkingstabel

De tabel toont per ontwerp:

**Ontwerpwaarden** — trajectlengte, volumes, oppervlaktes.

**Constructie** — type, diepte, offset-instellingen.

**Kosten** — bouwkosten, engineering, vastgoed, totalen.

**Effecten** — wonen & leefomgeving, natuur, verkeer, uitvoering.

### Grafieken

Via de sub-tab **Grafieken** kun je de vergelijking ook visueel bekijken in grafiekvorm.

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
