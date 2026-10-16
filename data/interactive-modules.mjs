// Product concepts only. Business entries never point to playable routes.
export const interactiveModules = [
  { id:'phishing', kind:'quiz', title:'Phishing erkennen', business:false, description:'Teste dein Wissen an realistischen Phishing-Situationen.', href:'/phishing-quiz/', action:'Quiz starten' },
  { id:'workplace', kind:'quiz', title:'Phishing im Arbeitsalltag', business:true, description:'Erkenne anspruchsvollere Phishing- und Social-Engineering-Situationen.' },
  { id:'ai-identity', kind:'quiz', title:'KI-Betrug & Identitätsfälschung', business:true, description:'Trainiere Entscheidungen bei glaubwürdigen, KI-unterstützten Betrugsversuchen.' },
  { id:'escape', kind:'game', title:'Phish Escape', business:false, description:'Erkenne den Angriff und triff die richtige Entscheidung.', href:'/phishing-simulation/?play=1', action:'Game starten' },
  { id:'fake-login', kind:'game', title:'Fake Login Challenge', business:true, description:'Erkenne täuschend echte Anmeldeversuche und verdächtige Login-Seiten.' },
  { id:'ceo-challenge', kind:'game', title:'CEO Fraud Challenge', business:true, description:'Triff sichere Entscheidungen bei gefälschten Zahlungsanweisungen.' }
];
