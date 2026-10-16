// Shared source for the three current services. Scope is agreed per engagement.
export const services = [
  {
    slug:'security-check', name:'Security Check', title:'Wissen, wo die Risiken liegen.',
    description:'Ein Security Check hilft Unternehmen, wesentliche Cyberrisiken zu erkennen, den Handlungsbedarf einzuordnen und Sicherheitsmassnahmen sinnvoll zu priorisieren.',
    problem:'Viele Schutzmassnahmen sind bereits vorhanden. Was oft fehlt, ist eine verständliche Einschätzung: Welche Risiken sind für unser Unternehmen besonders relevant, und wo lohnt sich der nächste Schritt?',
    questions:['Wo liegen unsere wichtigsten Risiken?','Welche Sicherheitsmassnahmen sind bereits vorhanden?','Welche technischen oder organisatorischen Lücken sollten wir prüfen?','Was sollte zuerst verbessert werden?'],
    support:'Swissploit verbindet technisches Verständnis mit einer klaren Einordnung für Management und IT. Gemeinsam legen wir fest, welche Bereiche betrachtet werden und welche Informationen dafür benötigt werden.',
    topics:['Identitäten, MFA und privilegierte Konten','Microsoft 365 und Cloud-Konfiguration','Endgeräte und zentrale Schutzmassnahmen','Backup und Wiederherstellung','Mail Security und externe Freigaben','Patch- und Vulnerability-Management','Sensibilisierung und organisatorische Security','Grundlegende Incident Readiness'],
    steps:[['Rahmen klären','Ziele, relevante Systeme, Ansprechpartner und Prüfumfang gemeinsam festlegen.'],['Situation einordnen','Die vereinbarten technischen und organisatorischen Bereiche anhand verfügbarer Informationen betrachten.'],['Prioritäten besprechen','Wesentliche Risiken verständlich einordnen und konkrete nächste Schritte abstimmen.']],
    outcomes:['Klarere Einschätzung wichtiger Sicherheitsrisiken','Verständliche Entscheidungsgrundlage','Priorisierte Handlungsempfehlungen','Unterstützung für Management und IT'],
    scope:'Der konkrete Umfang wird gemeinsam vereinbart. Technische Tests, Audits oder Zertifizierungen sind nicht automatisch enthalten.'
  },
  {
    slug:'datenschutz-care', name:'Datenschutz Care', title:'Datenschutz braucht klare Verantwortung.',
    description:'Swissploit unterstützt Unternehmen dabei, Datenschutzthemen strukturiert anzugehen, Zuständigkeiten zu klären und sinnvolle Massnahmen zu priorisieren.',
    problem:'Datenschutz besteht nicht nur aus einer Datenschutzerklärung. Neue Cloud-Dienste, Personendaten, externe Anbieter oder Löschbegehren bringen laufend neue Fragen in den Schweizer Unternehmensalltag.',
    questions:['Welche Personendaten verarbeiten wir?','Wer trägt welche Verantwortung?','Welche Prozesse sollten überprüft werden?','Wo besteht konkreter Handlungsbedarf?'],
    support:'Swissploit hilft, Verantwortlichkeiten, relevante Dokumente, Anbieter und Datenschutzprozesse zu organisieren. Technisches Security-Verständnis unterstützt dabei, aus Anforderungen konkrete Abläufe und Schutzmassnahmen zu entwickeln.',
    topics:['Organisation und Verantwortlichkeiten','Relevante Dokumente und Prozesse','Auftragsbearbeiter und externe Dienstleister','Neue Cloud- und KI-Dienste','Aufbewahrung und Löschung von Personendaten','Auskunfts- und Löschbegehren','Datenschutzvorfälle und interne Meldewege','Technische und organisatorische Schutzmassnahmen'],
    steps:[['Überblick schaffen','Daten, Beteiligte, Dokumente und bestehende Abläufe gemeinsam erfassen.'],['Verantwortung klären','Zuständigkeiten und Schnittstellen mit den relevanten Personen abstimmen.'],['Massnahmen priorisieren','Konkrete Aufgaben ordnen und die nächsten organisatorischen Schritte festhalten.']],
    outcomes:['Mehr Übersicht über Datenschutzthemen','Klarere Zuständigkeiten','Nachvollziehbare Prioritäten','Praktische Unterstützung im Alltag'],
    scope:'Schwerpunkte und Begleitung werden gemeinsam festgelegt. Eine pauschale Datenschutzkonformität oder rechtliche Garantie wird nicht zugesichert. Rechtsberatung ist nicht Bestandteil dieser beschriebenen Unterstützung.'
  },
  {
    slug:'incident-readiness', name:'Incident Readiness', title:'Im Cybervorfall zählt Vorbereitung.',
    description:'Ein Sicherheitsvorfall ist kein guter Zeitpunkt, um erst Verantwortlichkeiten und Abläufe festzulegen. Swissploit hilft Unternehmen dabei, sich organisatorisch auf Cybervorfälle vorzubereiten.',
    problem:'Unter Zeitdruck müssen Management und IT Entscheidungen treffen, Informationen einordnen und Ansprechpartner einbinden. Unklare Rollen und fehlende Kontaktwege erschweren ein strukturiertes Vorgehen.',
    questions:['Wer ist bei einem Vorfall verantwortlich?','Wer muss informiert werden?','Welche ersten Massnahmen sind wichtig?','Wie werden interne und externe Ansprechpartner eingebunden?','Welche Informationen müssen dokumentiert werden?'],
    support:'Swissploit hilft, Rollen, Eskalationen und Entscheidungsabläufe vor einem Vorfall zu klären. Bestehende IT-Partner und interne Verantwortliche werden in die Vorbereitung eingebunden.',
    topics:['Rollen und Verantwortlichkeiten','Eskalationswege','Interne und externe Notfallkontakte','Entscheidungsabläufe','Kommunikationswege','Abgestimmte erste technische Massnahmen','Melde- und Dokumentationsprozesse','Vorgehen für typische Cybervorfälle'],
    steps:[['Ausgangslage verstehen','Verantwortliche, Abhängigkeiten und vorhandene Notfallunterlagen betrachten.'],['Abläufe vorbereiten','Kontakte, Eskalation, Entscheidungen und Dokumentation gemeinsam strukturieren.'],['Vorgehen besprechen','Den Ablauf anhand passender Szenarien durchgehen. Eine Tabletop-Übung kann gesondert vereinbart werden.']],
    outcomes:['Klarere Verantwortlichkeiten','Vorbereitete Eskalationswege','Bessere Entscheidungsgrundlagen','Strukturierteres Vorgehen im Ernstfall'],
    scope:'Incident Readiness dient der Vorbereitung. Eine laufende Überwachung oder 24/7-Incident-Response-Leistung ist damit nicht verbunden. Umfang und Übungen werden gemeinsam vereinbart.'
  }
];
