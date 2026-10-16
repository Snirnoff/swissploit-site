// Text-only simulations under Swissploit-owned naming space; never requested or linked.
// Domain boundaries are editorial fields, never inferred from brand names.
export const categories = {
  "domains": "Links & Domains",
  "identity": "Absender & Identität",
  "pressure": "Social Engineering"
};

export const scenarios = [
  {
    "id": "vignette",
    "type": "search",
    "title": "Welches Suchergebnis würdest du öffnen?",
    "label": "Suchresultate",
    "categories": [
      "domains"
    ],
    "intro": "Du möchtest eine Schweizer E-Vignette beim offiziellen Anbieter kaufen.",
    "question": "Welches Suchergebnis würdest du öffnen?",
    "content": {
      "query": "E-Vignette Schweiz kaufen",
      "results": [
        {
          "id": "ad",
          "brand": "Vignette Service Schweiz",
          "url": "https://vignette-schweiz24.swissploit.ch/ch",
          "title": "E-Vignette Schweiz – in wenigen Minuten startklar",
          "description": "Digital bestellen. Sofortige Bearbeitung. Mit persönlichem Registrierungsservice.",
          "sponsored": true,
          "domain": "vignette-schweiz24.swissploit.ch",
          "feedback": "Ein Vermittler, nicht die offizielle Verkaufsstelle. Werbung allein bedeutet noch keinen Betrug."
        },
        {
          "id": "lookalike",
          "brand": "Via · Schweizer Autobahnvignette",
          "url": "https://via.admin.ch.vignette-kaufen.swissploit.ch/shop",
          "title": "Via – Schweizer E-Vignette online kaufen",
          "description": "Ihr digitales Portal für die Schweizer Autobahn. Kennzeichen eingeben und weiterfahren.",
          "domain": "vignette-kaufen.swissploit.ch",
          "feedback": "Die Seite wirkt offiziell, aber die Domain gehört nicht zur offiziellen Verkaufsstelle."
        },
        {
          "id": "official",
          "brand": "Bundesamt für Zoll und Grenzsicherheit",
          "url": "https://via.admin.ch/shop/",
          "title": "Via – E-Vignette der Schweizerischen Eidgenossenschaft",
          "description": "Die elektronische Vignette im Via-Portal des Bundesamts für Zoll und Grenzsicherheit kaufen.",
          "domain": "admin.ch",
          "feedback": "via.admin.ch gehört zum offiziellen Angebot des Bundes."
        },
        {
          "id": "discount",
          "brand": "Vignette Schweiz",
          "url": "https://via-vignette.swissploit.ch/shop",
          "title": "Schweizer E-Vignette – digital registrieren",
          "description": "Für Personenwagen und Motorräder. Kennzeichen erfassen und Bestätigung erhalten.",
          "domain": "via-vignette.swissploit.ch",
          "feedback": "Ein plausibler Titel bestätigt keinen Anbieter. Die Adresse ist keine Bundesdomain."
        }
      ]
    },
    "choices": [
      {
        "id": "ad",
        "label": "Vignette Service Schweiz"
      },
      {
        "id": "lookalike",
        "label": "Via · Schweizer Autobahnvignette"
      },
      {
        "id": "official",
        "label": "Bundesamt für Zoll und Grenzsicherheit"
      },
      {
        "id": "discount",
        "label": "Vignette Schweiz"
      }
    ],
    "correctAnswer": "official",
    "explanation": "War nicht so einfach, oder? Suchtreffer können amtlich aussehen. Hier führt via.admin.ch zum offiziellen Via-Portal. Werbung kann auch von legitimen Vermittlern stammen – «gesponsert» allein beweist weder Sicherheit noch Betrug.",
    "redFlags": [
      {
        "target": "ad",
        "title": "Werbung ist kein Vertrauensnachweis",
        "text": "Der erste Treffer ist bezahlt. Ein Registrierungsservice kann Zusatzgebühren verlangen; er ist nicht automatisch das offizielle Angebot."
      },
      {
        "target": "lookalike",
        "title": "Ein bekannter Name an der falschen Stelle",
        "text": "Bei via.admin.ch.vignette-kaufen.swissploit.ch gehört der Host zu vignette-kaufen.swissploit.ch. «admin.ch» davor macht ihn nicht zu einer Bundesadresse."
      },
      {
        "target": "discount",
        "title": "Ähnlicher Titel, andere Domain",
        "text": "via-vignette.swissploit.ch ist keine Adresse des Bundes. Namen und Gestaltung können fast identisch wirken."
      }
    ],
    "protectionTips": [
      "Bei Zahlungen und Behördenangeboten die Domain prüfen – nicht nur Titel und Logo.",
      "Vergleiche die vollständige Zieladresse und prüfe Anbieter sowie allfällige Zusatzgebühren."
    ],
    "learningNote": "War nicht so einfach, oder? Genau darauf setzen solche Angriffe: Du suchst etwas Normales und ein Treffer wirkt glaubwürdig. Anzeigen können auch seriöse Vermittler sein. Entscheidend ist, welchen Anbieter du suchst.",
    "verdict": "Das offizielle Angebot ist via.admin.ch.",
    "summary": "Bei Zahlungen und Behördenangeboten zählt die Domain – nicht Titel oder Logo.",
    "kind": "mixed",
    "learnArticleUrl": "/blog/gefaehrliche-links-erkennen/"
  },
  {
    "id": "m365",
    "type": "email",
    "title": "Würdest du den Zugriff bestätigen?",
    "label": "E-Mail",
    "categories": [
      "identity",
      "domains"
    ],
    "intro": "Montagmorgen. Deine IT hat keine Konto-Umstellung angekündigt.",
    "question": "Würdest du den Zugriff bestätigen?",
    "content": {
      "brand": "Microsoft 365",
      "subject": "Aktion erforderlich: Zugriff auf Ihr Postfach bestätigen",
      "sender": "Microsoft 365 Service",
      "to": "An: Alex Meier",
      "time": "Heute, 08:42",
      "heading": "Ihr Arbeitskonto braucht eine Bestätigung.",
      "paragraphs": [
        "Guten Tag",
        "Im Rahmen einer Sicherheitsaktualisierung müssen Sie den Zugriff auf Ihr Microsoft-365-Postfach erneut bestätigen. So bleiben E-Mails, Teams und Ihre Dokumente verfügbar."
      ],
      "cta": "Zugriff bestätigen",
      "footer": "Microsoft 365 · Kontoverwaltung"
    },
    "inspections": [
      {
        "id": "sender",
        "label": "Microsoft 365 Service",
        "value": "service@microsoft365-kontocenter.swissploit.ch",
        "caption": "Vollständige Absenderadresse",
        "domain": "microsoft365-kontocenter.swissploit.ch",
        "replyTo": "service@microsoft365-kontocenter.swissploit.ch"
      },
      {
        "id": "deadline",
        "label": "Bitte bestätigen Sie Ihr Konto innerhalb von 2 Stunden, um eine Unterbrechung zu vermeiden.",
        "value": "Frist: 2 Stunden · angekündigte Folge: Kontosperre",
        "caption": "Verlangte Handlung"
      },
      {
        "id": "link",
        "label": "Zugriff bestätigen",
        "value": "https://login.microsoft365-kontocenter.swissploit.ch/verify",
        "caption": "Tatsächliches Linkziel",
        "domain": "microsoft365-kontocenter.swissploit.ch"
      }
    ],
    "choices": [
      {
        "id": "trust",
        "label": "Ja"
      },
      {
        "id": "report",
        "label": "Nein"
      }
    ],
    "correctAnswer": "report",
    "explanation": "Gute Phishing-Mails wirken heute oft professionell. Hier passen Absender und Zieladresse nicht zum behaupteten Dienst. Zusammen mit der unerwarteten Aufforderung und dem Zeitdruck ist das ein klares Warnsignal.",
    "redFlags": [
      {
        "target": "sender",
        "title": "Anzeigename und Adresse passen nicht zusammen",
        "text": "«Microsoft 365 Service» ist nur der frei wählbare Anzeigename. Die Adresse dahinter gehört zur Beispieldomain microsoft365-kontocenter.swissploit.ch."
      },
      {
        "target": "link",
        "title": "Der Button führt woandershin",
        "text": "microsoft365-kontocenter.swissploit.ch ist eine fremde Domain. Ein Markenname in der Adresse macht sie nicht zu Microsoft."
      },
      {
        "target": "deadline",
        "title": "Zeitdruck statt nachvollziehbarer Ankündigung",
        "text": "Die drohende Unterbrechung soll dich zum schnellen Handeln bringen."
      }
    ],
    "protectionTips": [
      "Öffne Microsoft 365 über dein bekanntes Lesezeichen und frage bei deiner IT nach.",
      "Melde die Nachricht über den vorgesehenen Phishing-Meldeweg. Gib auf dem verlinkten Formular keine Zugangsdaten ein."
    ],
    "learningNote": "Auch ein bekanntes Absenderkonto kann übernommen worden sein. Adresse, Kontext und verlangte Handlung gehören immer zusammen.",
    "verdict": "Das war Phishing.",
    "summary": "Absender und Link gehören nicht zum behaupteten Anbieter.",
    "kind": "phishing",
    "learnArticleUrl": "/blog/phishing-erkennen/"
  },
  {
    "id": "invoice",
    "type": "email",
    "kind": "legitimate",
    "label": "E-Mail",
    "title": "Würdest du die Rechnung öffnen?",
    "question": "Würdest du die Rechnung öffnen?",
    "intro": "Alpenprint hat deinen Druckauftrag AP-2048 geliefert. Du kennst die Adresse rechnung@alpenprint.swissploit.ch aus früheren Bestellungen.",
    "categories": [
      "identity",
      "domains"
    ],
    "verdict": "Diese Nachricht war legitim.",
    "summary": "Auftrag, Absender und Rechnungsportal passen zusammen.",
    "content": {
      "brand": "Alpenprint",
      "avatar": "print",
      "subject": "Beleg AP-2048 / automatische Zustellung",
      "to": "An: Alex Meier",
      "time": "Heute, 10:14",
      "heading": "Ihr Beleg ist bereit.",
      "paragraphs": [
        "Guten Tag",
        "Im Anhang finden Sie die Rechnung für den gelieferten Druckauftrag AP-2048. Diese Nachricht wurde automatisch erstellt. Bitte geben Sie bei Rückfragen die Belegnummer an."
      ],
      "footer": "Alpenprint · Kundenservice"
    },
    "inspections": [
      {
        "id": "sender",
        "label": "Alpenprint Fakturierung",
        "value": "rechnung@alpenprint.swissploit.ch",
        "domain": "alpenprint.swissploit.ch",
        "replyTo": "kundenservice@alpenprint.swissploit.ch",
        "caption": "Absender und Antwortadresse"
      },
      {
        "id": "link",
        "label": "Rechnung im Kundenportal öffnen",
        "value": "https://kunden.alpenprint.swissploit.ch/rechnungen/AP-2048",
        "domain": "alpenprint.swissploit.ch",
        "caption": "Linkziel"
      },
      {
        "id": "attachment",
        "label": "Rechnung_AP-2048.pdf · 184 KB",
        "value": "Rechnung_AP-2048.pdf · PDF-Dokument · 184 KB",
        "caption": "Anhang · nur Vorschau, kein Download"
      }
    ],
    "choices": [
      {
        "id": "open",
        "label": "Ja"
      },
      {
        "id": "report",
        "label": "Nein"
      }
    ],
    "correctAnswer": "open",
    "redFlags": [
      {
        "target": "sender",
        "title": "Bekannte Absenderdomain",
        "text": "Absender und Antwortadresse gehören zur bekannten alpenprint.swissploit.ch."
      },
      {
        "target": "link",
        "title": "Portal auf derselben Domain",
        "text": "kunden ist eine Subdomain von alpenprint.swissploit.ch. Der zusätzliche Name führt hier nicht zu einem anderen Betreiber."
      },
      {
        "target": "attachment",
        "title": "Beleg passt zum gelieferten Auftrag",
        "text": "Nummer, Lieferkontext und PDF-Anhang passen zusammen. Die Dateiendung allein beweist keine Sicherheit."
      }
    ],
    "explanation": "Automatische Mails klingen manchmal ungewohnt. Hier stimmen der unabhängig bekannte Auftrag und die Adressen überein. Ein nüchterner Text ist kein Phishing-Beweis.",
    "protectionTips": [
      "Prüfe Auftrag, Absender und Link gemeinsam. Bei Widersprüchen frage über deinen bekannten Kontakt nach."
    ],
    "learnArticleUrl": "/blog/phishing-erkennen/",
    "learnArticleTitle": "Phishing erkennen: die entscheidenden Hinweise"
  },
  {
    "id": "qr",
    "type": "qr",
    "title": "Würdest du über diesen QR-Code bezahlen?",
    "label": "QR-Code",
    "categories": [
      "domains"
    ],
    "intro": "Eine Parkrechnung im Briefkasten. An diesen Parkvorgang erinnerst du dich nicht.",
    "question": "Würdest du über diesen QR-Code bezahlen?",
    "content": {
      "brand": "CityPark Service",
      "reference": "Zahlungserinnerung · Referenz CP-2048",
      "heading": "Ihre Parkgebühr ist noch offen.",
      "paragraphs": [
        "Für Ihren letzten Parkvorgang ist noch eine Gebühr offen. Bitte begleichen Sie den Betrag bequem über unser Online-Portal."
      ],
      "amount": "CHF 18.00",
      "deadline": "Zahlbar innert 24 Stunden. Danach können weitere Gebühren anfallen."
    },
    "inspections": [
      {
        "id": "qr",
        "label": "QR-Ziel prüfen",
        "value": "https://citypark.zahlung-pruefen.swissploit.ch/pay",
        "caption": "Simulierte Linkvorschau – kein echter Scan",
        "domain": "zahlung-pruefen.swissploit.ch"
      },
      {
        "id": "deadline",
        "label": "Zahlbar innert 24 Stunden. Danach können weitere Gebühren anfallen.",
        "value": "24 Stunden Frist bei einer unerwarteten Forderung",
        "caption": "Zahlungsaufforderung"
      }
    ],
    "choices": [
      {
        "id": "pay",
        "label": "Ja"
      },
      {
        "id": "verify",
        "label": "Nein"
      }
    ],
    "correctAnswer": "verify",
    "explanation": "QR-Phishing heisst auch Quishing. Ein QR-Code versteckt sein Ziel zunächst hinter einem Muster. Hier stimmen die unerwartete Forderung und die fremde Zahlungsdomain nicht mit einem verlässlich geprüften Parkvorgang überein.",
    "redFlags": [
      {
        "target": "qr",
        "title": "Ein fremdes Zahlungsziel",
        "text": "citypark ist nur die Subdomain von zahlung-pruefen.swissploit.ch. Das Logo auf dem Brief bestätigt diesen Anbieter nicht."
      },
      {
        "target": "deadline",
        "title": "Eine kurze Frist mit Gebührenandrohung",
        "text": "Der kleine Betrag und die kurze Frist sollen eine Zahlung ohne Rückfrage begünstigen."
      },
      {
        "title": "Kein nachvollziehbarer Vorgang",
        "text": "Eine Referenznummer allein beweist keine Forderung. Prüfe Ort, Datum, Betrag und Anbieter anhand deiner eigenen Unterlagen."
      }
    ],
    "protectionTips": [
      "Prüfe unerwartete QR-Zahlungen zuerst über einen bekannten Kontaktweg beim Anbieter.",
      "Bei Zahlungs-QR-Codes prüfst du zusätzlich Empfänger, IBAN und Betrag vor der Freigabe in der Banking-App."
    ],
    "learningNote": "Scannen ist nicht dasselbe wie Bezahlen. Entscheidend ist, wohin du weitergeleitet wirst und welche Handlung du anschliessend freigibst. HTTPS allein bestätigt keinen seriösen Betreiber.",
    "verdict": "Das war eine QR-Falle.",
    "summary": "Die Zahlungsadresse gehört zu einem fremden Anbieter.",
    "kind": "phishing",
    "learnArticleUrl": "/blog/qr-phishing-quishing/"
  },
  {
    "id": "login",
    "type": "login",
    "title": "Würdest du dich hier anmelden?",
    "label": "Login-Seite",
    "categories": [
      "domains",
      "identity"
    ],
    "intro": "Ein Geschäftskontakt teilt eine Offerte mit dir. Du landest auf dieser Seite.",
    "question": "Würdest du dich hier anmelden?",
    "content": {
      "brand": "Microsoft",
      "document": "Offerte_Q4.pdf",
      "heading": "Dokument sicher ansehen",
      "paragraphs": [
        "Dieses Dokument wurde für Sie freigegeben. Melden Sie sich mit Ihrem Arbeitskonto an, um es zu öffnen."
      ],
      "cta": "Mit Microsoft anmelden"
    },
    "inspections": [
      {
        "id": "address",
        "label": "https://sharepoint.com.dokument-freigabe.swissploit.ch/view",
        "value": "https://sharepoint.com.dokument-freigabe.swissploit.ch/view",
        "caption": "Vollständige Adresse in der Browserleiste",
        "domain": "dokument-freigabe.swissploit.ch"
      },
      {
        "id": "login",
        "label": "Mit Microsoft anmelden",
        "value": "Die Anmeldung würde auf dokument-freigabe.swissploit.ch stattfinden.",
        "caption": "Simulierter Anmeldebutton"
      }
    ],
    "choices": [
      {
        "id": "signin",
        "label": "Ja"
      },
      {
        "id": "check",
        "label": "Nein"
      }
    ],
    "correctAnswer": "check",
    "explanation": "Die Gestaltung lässt sich kopieren, die Domain verrät hier das fremde Ziel. Die Seite gehört nicht zu sharepoint.com. Ein vertrautes Logo und eine behauptete «sichere» Freigabe reichen nicht, um Zugangsdaten einzugeben.",
    "redFlags": [
      {
        "target": "address",
        "title": "Der Markenname steht nur vorne",
        "text": "dokument-freigabe.swissploit.ch ist die entscheidende Domain. sharepoint.com ist hier lediglich ein davor gesetzter Name."
      },
      {
        "target": "login",
        "title": "Anmeldung auf einem fremden Ziel",
        "text": "Ein Button mit Microsoft-Logo beweist keine Verbindung zu Microsoft."
      },
      {
        "title": "Die Weiterleitung passt nicht",
        "text": "Auch ein bekannter Geschäftskontakt kann einen schädlichen Link versenden. Prüfe das Ziel unabhängig vom Namen."
      }
    ],
    "protectionTips": [
      "Öffne den Dienst über dein Lesezeichen und prüfe dort die Freigabe.",
      "Nutze nach Möglichkeit phishing-resistente Anmeldeverfahren wie Passkeys. Bestätige keine unerwarteten MFA-Anfragen."
    ],
    "learningNote": "Hier gibt es bewusst keine Eingabefelder. Die Simulation fragt keine E-Mail-Adresse und kein Passwort ab.",
    "verdict": "Das war eine gefälschte Login-Seite.",
    "summary": "Die Adresse gehört nicht zu SharePoint. Das Logo lässt sich kopieren.",
    "kind": "phishing",
    "learnArticleUrl": "/blog/gefaehrliche-links-erkennen/"
  },
  {
    "id": "appointment",
    "type": "sms",
    "kind": "legitimate",
    "label": "SMS",
    "title": "Würdest du den Termin bestätigen?",
    "question": "Würdest du den Termin bestätigen?",
    "intro": "Du hast morgen einen Termin bei Velowerk. Auf deiner Buchung steht termine.velowerk.swissploit.ch als Bestätigungsportal.",
    "categories": [
      "domains",
      "pressure"
    ],
    "verdict": "Diese SMS war legitim.",
    "summary": "Termin und Zieladresse stimmen mit deiner Buchung überein.",
    "content": {
      "brand": "Velowerk",
      "time": "09:41",
      "received": "Heute, 09:38",
      "message": "Terminservice: Bitte bestätigen Sie Ihre Velo-Inspektion morgen um 08:30. Buchung VW-381. Diese SMS ist automatisch; Antworten werden nicht gelesen.",
      "avatar": "bike"
    },
    "inspections": [
      {
        "id": "sender",
        "label": "Velowerk",
        "value": "Anzeigename: Velowerk · Identität nicht bestätigt",
        "caption": "SMS-Absender"
      },
      {
        "id": "link",
        "label": "termine.velowerk.swissploit.ch/VW-381",
        "value": "https://termine.velowerk.swissploit.ch/VW-381",
        "domain": "velowerk.swissploit.ch",
        "caption": "Linkziel"
      }
    ],
    "choices": [
      {
        "id": "confirm",
        "label": "Ja"
      },
      {
        "id": "report",
        "label": "Nein"
      }
    ],
    "correctAnswer": "confirm",
    "redFlags": [
      {
        "target": "link",
        "title": "Domain entspricht der Buchung",
        "text": "Du kennst das Portal aus deiner eigenen Buchungsbestätigung, nicht erst aus dieser SMS."
      },
      {
        "title": "Termin und Referenz stimmen",
        "text": "Datum, Uhrzeit und Buchungsnummer passen zu deinem Auftrag."
      },
      {
        "title": "Keine Zahlung oder Kontofreigabe",
        "text": "Die Nachricht verlangt nur die erwartete Terminbestätigung. Sie fordert keine zusätzlichen sensiblen Angaben."
      }
    ],
    "explanation": "Ein automatischer Text und «nicht antworten» sind kein Beweis für Betrug. Der Anzeigename allein wäre allerdings ebenfalls kein Beweis für Echtheit. Hier bestätigen die unabhängig bekannten Buchungsdaten das Ziel.",
    "protectionTips": [
      "Vergleiche das Linkziel mit deiner Buchung. Fragt die Seite plötzlich nach Zahlungs- oder Zugangsdaten, stoppe und kläre nach."
    ]
  },
  {
    "id": "sms",
    "type": "sms",
    "title": "Würdest du diesen Link öffnen?",
    "label": "SMS",
    "categories": [
      "identity",
      "pressure"
    ],
    "intro": "Du erwartest ein Paket. Dann kommt diese SMS.",
    "question": "Würdest du diesen Link öffnen?",
    "content": {
      "brand": "PaketService",
      "time": "09:41",
      "received": "Heute, 09:38",
      "message": "Ihre Sendung wartet im Verteilzentrum. Für die Zustellung fehlt die Hausnummer. Bitte ergänzen Sie die Lieferadresse über den folgenden Link. Referenz: CH-28491.",
      "avatar": "parcel"
    },
    "inspections": [
      {
        "id": "sender",
        "label": "PaketService",
        "value": "Anzeigename: PaketService · Identität nicht bestätigt",
        "caption": "Absenderdetails"
      },
      {
        "id": "link",
        "label": "post-service.swissploit.ch/ch/28491",
        "value": "https://post-service.swissploit.ch/ch/28491",
        "caption": "Tatsächliches SMS-Linkziel",
        "domain": "post-service.swissploit.ch"
      }
    ],
    "choices": [
      {
        "id": "pay",
        "label": "Ja"
      },
      {
        "id": "app",
        "label": "Nein"
      }
    ],
    "correctAnswer": "app",
    "explanation": "Smishing ist Phishing per SMS. Diese Nachricht braucht weder Fehler noch Zeitdruck: Eine erwartete Lieferung reicht als plausibler Vorwand, um dich auf eine fremde Seite zu führen.",
    "redFlags": [
      {
        "target": "sender",
        "title": "Der angezeigte Name beweist keine Identität",
        "text": "Absendernamen können manipuliert werden. Auch eine Einordnung in einen bekannten SMS-Verlauf ist kein sicherer Nachweis."
      },
      {
        "target": "link",
        "title": "Bekannter Name, fremde Domain",
        "text": "post-service.swissploit.ch gehört nicht zu post.ch. Das Wort «Post» im Namen ist kein Nachweis."
      },
      {
        "title": "Die Referenz bestätigt nichts",
        "text": "Prüfe die Sendungsnummer in deiner Bestellung oder der bekannten App. Eine erfundene Nummer kann plausibel wirken."
      }
    ],
    "protectionTips": [
      "Prüfe die Sendung über die bereits installierte App oder eine selbst aufgerufene bekannte Website.",
      "Gib über den SMS-Link keine Zahlungsdaten ein. Melde die Nachricht und lösche sie danach gemäss dem Meldeprozess."
    ],
    "verdict": "Das war Phishing per SMS.",
    "summary": "Eine erwartete Lieferung bestätigt weder den Absender noch diesen Link.",
    "kind": "phishing",
    "learnArticleUrl": "/blog/smishing-phishing-per-sms/"
  },
  {
    "id": "portal",
    "type": "login",
    "kind": "legitimate",
    "label": "Login-Seite",
    "title": "Würdest du dich hier anmelden?",
    "question": "Würdest du dich hier anmelden?",
    "intro": "Deine Treuhänderin hat neue Unterlagen angekündigt. Ihr bekanntes Portal ist portal.alpentreuhand.swissploit.ch.",
    "categories": [
      "domains",
      "identity"
    ],
    "verdict": "Das war das bekannte Kundenportal.",
    "summary": "Die vollständige Adresse und die angekündigte Freigabe passen.",
    "content": {
      "brand": "Alpentreuhand",
      "avatar": "building",
      "document": "Abschluss_Q3.pdf",
      "heading": "Ihre Sitzung ist abgelaufen.",
      "paragraphs": [
        "Bitte melden Sie sich erneut an, um die bereitgestellten Unterlagen zu öffnen."
      ],
      "cta": "Im Kundenportal anmelden"
    },
    "inspections": [
      {
        "id": "address",
        "label": "https://portal.alpentreuhand.swissploit.ch/dokumente",
        "value": "https://portal.alpentreuhand.swissploit.ch/dokumente",
        "domain": "alpentreuhand.swissploit.ch",
        "caption": "Browseradresse"
      },
      {
        "id": "login",
        "label": "Im Kundenportal anmelden",
        "value": "https://portal.alpentreuhand.swissploit.ch/anmelden",
        "domain": "alpentreuhand.swissploit.ch",
        "caption": "Ziel der Anmeldung"
      }
    ],
    "choices": [
      {
        "id": "signin",
        "label": "Ja"
      },
      {
        "id": "reject",
        "label": "Nein"
      }
    ],
    "correctAnswer": "signin",
    "redFlags": [
      {
        "target": "address",
        "title": "Exakt die bekannte Portaladresse",
        "text": "portal.alpentreuhand.swissploit.ch stimmt vollständig mit der unabhängig bekannten Adresse überein."
      },
      {
        "target": "login",
        "title": "Anmeldung bleibt beim Portal",
        "text": "Der Anmeldebutton führt auf denselben bekannten Host."
      },
      {
        "title": "Die Unterlagen waren angekündigt",
        "text": "Es gibt einen passenden Anlass. Eine abgelaufene Sitzung allein ist kein Warnsignal."
      }
    ],
    "explanation": "Eine erneute Anmeldung ist nicht automatisch verdächtig. Prüfe die vollständige Adresse und den Anlass, bevor du Zugangsdaten eingibst. Ein vertrautes Design allein würde nicht genügen.",
    "protectionTips": [
      "Nutze dein geprüftes Lesezeichen. Bei einer unerwarteten Weiterleitung prüfst du auch die neue Adresse."
    ],
    "learnArticleUrl": "/blog/gefaehrliche-links-erkennen/"
  },
  {
    "id": "ceo",
    "type": "business",
    "title": "Würdest du diese Zahlung freigeben?",
    "label": "Interne Nachricht",
    "categories": [
      "pressure",
      "identity"
    ],
    "intro": "Du arbeitest bei der fiktiven Bergtal AG. Kurz vor Feierabend schreibt die Chefin.",
    "question": "Würdest du diese Zahlung freigeben?",
    "content": {
      "brand": "Bergtal AG",
      "subject": "Vertraulich: Zahlung vor 17:00 Uhr",
      "sender": "Anna Keller · Geschäftsführung",
      "to": "An: Administration",
      "time": "Heute, 16:48",
      "heading": "Kannst du das kurz für mich übernehmen?",
      "paragraphs": [
        "Hallo, ich sitze gerade in Verhandlungen und bin telefonisch nicht erreichbar.",
        "Bitte überweise heute noch CHF 8’450 an unseren neuen Partner. Die Bankverbindung schicke ich dir gleich. Es ist mit mir abgestimmt; die zweite Freigabe können wir morgen nachholen."
      ],
      "cta": "",
      "footer": "Anna Keller · Geschäftsführerin · Bergtal AG"
    },
    "inspections": [
      {
        "id": "sender",
        "label": "Anna Keller · Geschäftsführung",
        "value": "anna.keller@bergtal.swissploit.ch",
        "caption": "Vollständige Absenderadresse",
        "domain": "bergtal.swissploit.ch",
        "replyTo": "anna.keller@bergtal.swissploit.ch"
      },
      {
        "id": "pressure",
        "label": "Bitte nicht im Team besprechen. Ich verlasse mich auf dich. Bestätige mir hier kurz, sobald die Zahlung raus ist.",
        "value": "Zahlung heute vor 17:00 · zweite Freigabe morgen · keine Rücksprache im Team",
        "caption": "Angefragter Ablauf"
      }
    ],
    "choices": [
      {
        "id": "pay",
        "label": "Ja"
      },
      {
        "id": "verify",
        "label": "Nein"
      }
    ],
    "correctAnswer": "verify",
    "explanation": "CEO-Fraud nutzt Autorität und Vertrauen. Selbst die richtige Firmenadresse ist keine Garantie: Ein Konto kann übernommen worden sein. Eine Antwort im selben Kanal kann wieder beim Angreifer landen. Stoppe die Zahlung und verifiziere unabhängig.",
    "redFlags": [
      {
        "target": "pressure",
        "title": "Kontrollen sollen ausnahmsweise entfallen",
        "text": "Eine fehlende zweite Freigabe wird mit Dringlichkeit begründet. Genau solche Ausnahmen sind ein starkes Warnsignal."
      },
      {
        "target": "pressure",
        "title": "Geheimhaltung und Autoritätsdruck",
        "text": "«Nicht im Team besprechen» verhindert eine unabhängige Prüfung."
      },
      {
        "target": "sender",
        "title": "Ein bekannter Absender ist nicht genug",
        "text": "Der Anzeigename und sogar die echte Adresse können zu einer übernommenen Identität gehören. Prüfe die ungewöhnliche Handlung."
      }
    ],
    "protectionTips": [
      "Rufe über eine bereits bekannte, intern hinterlegte Nummer an. Nutze keine neue Nummer aus der Nachricht.",
      "Halte das Vier-Augen-Prinzip ein und melde den Verdacht intern. Bei Nichterreichbarkeit bleibt die Zahlung ausgesetzt."
    ],
    "learningNote": "Richtig handeln heisst hier nicht einfach ignorieren. Deine Meldung kann verhindern, dass Kolleginnen oder Kollegen dieselbe Anfrage ausführen.",
    "verdict": "Hier war eine unabhängige Rückfrage nötig.",
    "summary": "Auch eine echte Firmenadresse rechtfertigt keine Umgehung der Freigabe.",
    "kind": "phishing",
    "learnArticleUrl": "/blog/ceo-fraud/"
  }
];
