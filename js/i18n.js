(function () {
  'use strict';

  var T = {};

  T.en = {
    // Nav
    menu: '☰',
    home: '🏠 Home',
    createFilm: '✨ Create Film',
    myFilms: '🎬 My Films',
    addCredits: '💎 Add Credits',
    profile: '👤 Profile',
    invite: '🔗 Invite Friends',
    socials: '📱 Social Accounts',
    howItWorks: '❓ How It Works',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    logIn: '🔑 Log In',
    logOut: '🚪 Log Out',

    // Landing
    heroTitle: 'RESONATALE',
    heroTagline: 'Type a story. Get a film.',
    heroSub: 'AI cinema — narrated in your voice.',
    createYourFilm: 'Create Your Film',

    // Setup
    setupTitle: 'Setup Your Voice',
    setupSub: 'Record your voice once. AI clones it to narrate all your films.',
    speakNaturally: 'Speak naturally for 10–30 seconds.',
    holdToRecord: 'Hold to Record',
    continue_: 'Continue',
    voiceEncrypted: 'Your voice is encrypted and never shared.',

    // Auth
    createAccount: 'Create your account',
    welcomeBack: 'Welcome back',
    email: 'Email',
    password: 'Password (8+ chars)',
    signUp: 'Sign Up',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: 'No account?',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset your password',
    sendResetCode: 'Send Reset Code',
    enterCode: 'Enter the code from your email',
    resetCode: 'Reset code',
    newPassword: 'New password (8+ chars)',
    resetBtn: 'Reset Password',
    backToLogin: 'Back to login',

    // Create
    createTitle: 'Create Your Film',
    language: 'Language',
    mood: 'Mood',
    yourStory: 'Your Story',
    storyPlaceholder: 'A detective in 1920s Paris discovers a secret message hidden in a painting...',
    filmDuration: 'Film Duration',
    previewScript: 'Preview Script — Free',
    previewHint: 'Preview your screenplay before spending credits.',

    // Moods
    calm: 'Calm', cozy: 'Cozy', adventure: 'Adventure', romantic: 'Romantic',
    suspense: 'Suspense', motivational: 'Motivational', heartwarming: 'Heartwarming',
    dramatic: 'Dramatic', thriller: 'Thriller', action: 'Action', spiritual: 'Spiritual',
    comedy: 'Comedy', horror: 'Horror', mystery: 'Mystery', inspirational: 'Inspirational',

    // Preview
    screenplayTitle: 'Your Screenplay',
    createFullFilm: '🎥 Create Full Film',
    usesCredits: 'Uses credits based on film length.',
    editStory: '← Edit Story',

    // Rendering
    creatingFilm: 'Creating Your Film',
    writingScript: 'Writing Script',
    filmingScenes: 'Filming Scenes',
    recordingVoice: 'Recording Voice',
    stitchingFilm: 'Stitching Film',
    complete: 'Complete',
    renderPatience: 'This may take several minutes. We\'ll email you when your film is ready.',

    // Player
    filmReady: 'Your Film Is Ready',
    shareFilm: 'Share Your Film',
    downloadMp4: '⬇ Download MP4',
    createAnother: 'Create Another Film',

    // Credits
    addCreditsTitle: 'Add Credits',
    yourBalance: 'Your Balance',
    chooseAmount: 'Choose Amount',
    creditHint: '$1 = 1 credit · Credits never expire',
    whatCreditsBuy: 'What Credits Buy',
    addCreditsBtn: 'Add Credits',
    minimum: 'Minimum $10',

    // Profile
    profileTitle: 'My Profile',
    memberSince: 'Member since',
    credits: 'Credits',
    voice: 'Voice',
    voiceCloned: 'Cloned ✓',
    voiceNotSet: 'Not recorded',
    reRecord: 'Re-record',
    add: '+ Add',

    // Invite
    inviteTitle: 'Invite Friends',
    inviteSub: 'Earn 5 credits for every friend who creates their first film.',
    yourReferralLink: 'Your Referral Link',
    copyLink: 'Copy Link',
    shareVia: 'Share via',

    // Socials
    socialsTitle: 'Social Accounts',
    socialsSub: 'Connect your accounts. Films auto-post when ready.',
    connectYoutube: 'Connect YouTube',
    connectTiktok: 'Connect TikTok',
    connectInstagram: 'Connect Instagram',
    connectX: 'Connect X',
    disconnect: 'Disconnect',
    connected: 'Connected',
    notConnected: 'Not connected',
    autoPostOn: 'Auto-post on',
    autoPostOff: 'Auto-post off',

    // How It Works
    howTitle: 'How It Works',
    step1Title: 'Describe Your Story',
    step1Desc: 'Type your idea. A spy in Tokyo. A love story in Paris. Anything you imagine.',
    step2Title: 'AI Creates Cinema',
    step2Desc: 'AI writes the screenplay and generates stunning cinematic video scenes.',
    step3Title: 'Your Voice Narrates',
    step3Desc: 'Record once. AI clones your voice and narrates every film you create.',
    step4Title: 'Download & Share',
    step4Desc: 'Get your HD film in minutes. Share anywhere.',
    simplePricing: 'Simple Pricing',
    pricingSub: 'Pay per film. No subscription. Credits never expire.',

    // Dashboard
    dashTitle: 'My Films',
    noFilms: 'No films yet.',

    // Duration
    seconds: 'seconds',
    minute: 'minute',
    minutes: 'minutes',
    scenes: 'scenes',

    // Back
    back: '← Back',
  };

  T.es = Object.assign({}, T.en, {
    menu: '☰', home: '🏠 Inicio', createFilm: '✨ Crear Película', myFilms: '🎬 Mis Películas',
    addCredits: '💎 Agregar Créditos', profile: '👤 Perfil', invite: '🔗 Invitar Amigos',
    socials: '📱 Redes Sociales',
    howItWorks: '❓ Cómo Funciona', privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto',
    logIn: '🔑 Iniciar Sesión', logOut: '🚪 Cerrar Sesión',
    heroTagline: 'Escribe una historia. Obtén una película.',
    heroSub: 'Cine con IA — narrado con tu voz.',
    createYourFilm: 'Crea Tu Película',
    setupTitle: 'Configura Tu Voz', setupSub: 'Graba tu voz una vez. La IA la clona para narrar todas tus películas.',
    speakNaturally: 'Habla naturalmente por 10–30 segundos.',
    holdToRecord: 'Mantén para Grabar', continue_: 'Continuar',
    voiceEncrypted: 'Tu voz está encriptada y nunca se comparte.',
    createAccount: 'Crea tu cuenta', welcomeBack: 'Bienvenido de vuelta',
    email: 'Correo electrónico', password: 'Contraseña (8+ caracteres)',
    signUp: 'Registrarse', alreadyHaveAccount: '¿Ya tienes cuenta?',
    noAccount: '¿No tienes cuenta?', forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer contraseña', sendResetCode: 'Enviar Código',
    enterCode: 'Ingresa el código de tu correo', resetCode: 'Código de restablecimiento',
    newPassword: 'Nueva contraseña (8+ caracteres)', resetBtn: 'Restablecer Contraseña',
    backToLogin: 'Volver al inicio de sesión',
    createTitle: 'Crea Tu Película', language: 'Idioma', mood: 'Ambiente', yourStory: 'Tu Historia',
    storyPlaceholder: 'Un detective en París de los años 20 descubre un mensaje secreto oculto en una pintura...',
    filmDuration: 'Duración de la Película',
    previewScript: 'Vista Previa del Guión — Gratis',
    previewHint: 'Vista previa de tu guión antes de gastar créditos.',
    calm: 'Calma', cozy: 'Acogedor', adventure: 'Aventura', romantic: 'Romántico',
    suspense: 'Suspenso', motivational: 'Motivacional', heartwarming: 'Conmovedor',
    dramatic: 'Dramático', thriller: 'Thriller', action: 'Acción', spiritual: 'Espiritual',
    comedy: 'Comedia', horror: 'Terror', mystery: 'Misterio', inspirational: 'Inspirador',
    screenplayTitle: 'Tu Guión', createFullFilm: '🎥 Crear Película Completa',
    usesCredits: 'Usa créditos según la duración.', editStory: '← Editar Historia',
    creatingFilm: 'Creando Tu Película', writingScript: 'Escribiendo Guión',
    filmingScenes: 'Filmando Escenas', recordingVoice: 'Grabando Voz',
    stitchingFilm: 'Ensamblando Película', complete: 'Completo',
    renderPatience: 'Esto puede tardar varios minutos. Te enviaremos un correo cuando tu película esté lista.',
    filmReady: 'Tu Película Está Lista', shareFilm: 'Comparte Tu Película',
    downloadMp4: '⬇ Descargar MP4', createAnother: 'Crear Otra Película',
    addCreditsTitle: 'Agregar Créditos', yourBalance: 'Tu Saldo', chooseAmount: 'Elegir Monto',
    creditHint: '$1 = 1 crédito · Los créditos nunca expiran',
    whatCreditsBuy: 'Qué Compran los Créditos', addCreditsBtn: 'Agregar Créditos', minimum: 'Mínimo $10',
    profileTitle: 'Mi Perfil', memberSince: 'Miembro desde', credits: 'Créditos',
    voice: 'Voz', voiceCloned: 'Clonada ✓', voiceNotSet: 'No grabada', reRecord: 'Re-grabar', add: '+ Agregar',
    inviteTitle: 'Invitar Amigos', inviteSub: 'Gana 5 créditos por cada amigo que cree su primera película.',
    yourReferralLink: 'Tu Enlace de Referencia', copyLink: 'Copiar Enlace', shareVia: 'Compartir vía',
    socialsTitle: 'Redes Sociales', socialsSub: 'Conecta tus cuentas. Los filmes se publican automáticamente.',
    connectYoutube: 'Conectar YouTube', connectTiktok: 'Conectar TikTok',
    connectInstagram: 'Conectar Instagram', connectX: 'Conectar X',
    disconnect: 'Desconectar', connected: 'Conectado', notConnected: 'No conectado',
    howTitle: 'Cómo Funciona',
    step1Title: 'Describe Tu Historia', step1Desc: 'Escribe tu idea. Un espía en Tokio. Una historia de amor en París.',
    step2Title: 'La IA Crea Cine', step2Desc: 'La IA escribe el guión y genera escenas cinematográficas.',
    step3Title: 'Tu Voz Narra', step3Desc: 'Graba una vez. La IA clona tu voz y narra cada película.',
    step4Title: 'Descarga y Comparte', step4Desc: 'Obtén tu película HD en minutos.',
    simplePricing: 'Precios Simples', pricingSub: 'Paga por película. Sin suscripción. Los créditos nunca expiran.',
    dashTitle: 'Mis Películas', noFilms: 'Aún no hay películas.',
    seconds: 'segundos', minute: 'minuto', minutes: 'minutos', scenes: 'escenas',
    back: '← Atrás',
  });

  T.fr = Object.assign({}, T.en, {
    menu: '☰', home: '🏠 Accueil', createFilm: '✨ Créer un Film', myFilms: '🎬 Mes Films',
    addCredits: '💎 Ajouter des Crédits', profile: '👤 Profil', invite: '🔗 Inviter des Amis',
    socials: '📱 Réseaux Sociaux',
    howItWorks: '❓ Comment ça Marche', privacy: 'Confidentialité', terms: 'Conditions', contact: 'Contact',
    logIn: '🔑 Connexion', logOut: '🚪 Déconnexion',
    heroTagline: 'Écrivez une histoire. Obtenez un film.',
    heroSub: 'Cinéma IA — narré par votre voix.',
    createYourFilm: 'Créez Votre Film',
    setupTitle: 'Configurez Votre Voix', setupSub: 'Enregistrez votre voix une fois. L\'IA la clone pour narrer tous vos films.',
    speakNaturally: 'Parlez naturellement pendant 10–30 secondes.',
    holdToRecord: 'Maintenez pour Enregistrer', continue_: 'Continuer',
    voiceEncrypted: 'Votre voix est chiffrée et jamais partagée.',
    createAccount: 'Créez votre compte', welcomeBack: 'Bon retour',
    email: 'Email', password: 'Mot de passe (8+ caractères)',
    signUp: 'S\'inscrire', alreadyHaveAccount: 'Déjà un compte?',
    noAccount: 'Pas de compte?', forgotPassword: 'Mot de passe oublié?',
    resetPassword: 'Réinitialiser le mot de passe', sendResetCode: 'Envoyer le Code',
    enterCode: 'Entrez le code de votre email', resetCode: 'Code de réinitialisation',
    newPassword: 'Nouveau mot de passe (8+ caractères)', resetBtn: 'Réinitialiser',
    backToLogin: 'Retour à la connexion',
    createTitle: 'Créez Votre Film', language: 'Langue', mood: 'Ambiance', yourStory: 'Votre Histoire',
    storyPlaceholder: 'Un détective dans le Paris des années 20 découvre un message secret caché dans un tableau...',
    filmDuration: 'Durée du Film',
    previewScript: 'Aperçu du Scénario — Gratuit',
    previewHint: 'Aperçu de votre scénario avant de dépenser des crédits.',
    calm: 'Calme', cozy: 'Cosy', adventure: 'Aventure', romantic: 'Romantique',
    suspense: 'Suspense', motivational: 'Motivant', heartwarming: 'Émouvant',
    dramatic: 'Dramatique', thriller: 'Thriller', action: 'Action', spiritual: 'Spirituel',
    comedy: 'Comédie', horror: 'Horreur', mystery: 'Mystère', inspirational: 'Inspirant',
    screenplayTitle: 'Votre Scénario', createFullFilm: '🎥 Créer le Film Complet',
    usesCredits: 'Utilise des crédits selon la durée.', editStory: '← Modifier l\'Histoire',
    creatingFilm: 'Création de Votre Film', writingScript: 'Écriture du Scénario',
    filmingScenes: 'Tournage des Scènes', recordingVoice: 'Enregistrement de la Voix',
    stitchingFilm: 'Assemblage du Film', complete: 'Terminé',
    renderPatience: 'Cela peut prendre plusieurs minutes. Nous vous enverrons un email quand votre film sera prêt.',
    filmReady: 'Votre Film Est Prêt', shareFilm: 'Partagez Votre Film',
    downloadMp4: '⬇ Télécharger MP4', createAnother: 'Créer un Autre Film',
    addCreditsTitle: 'Ajouter des Crédits', yourBalance: 'Votre Solde', chooseAmount: 'Choisir le Montant',
    creditHint: '1$ = 1 crédit · Les crédits n\'expirent jamais',
    whatCreditsBuy: 'Ce que les Crédits Achètent', addCreditsBtn: 'Ajouter des Crédits', minimum: 'Minimum 10$',
    profileTitle: 'Mon Profil', memberSince: 'Membre depuis', credits: 'Crédits',
    voice: 'Voix', voiceCloned: 'Clonée ✓', voiceNotSet: 'Non enregistrée', reRecord: 'Ré-enregistrer', add: '+ Ajouter',
    inviteTitle: 'Inviter des Amis', inviteSub: 'Gagnez 5 crédits pour chaque ami qui crée son premier film.',
    yourReferralLink: 'Votre Lien de Parrainage', copyLink: 'Copier le Lien', shareVia: 'Partager via',
    socialsTitle: 'Réseaux Sociaux', socialsSub: 'Connectez vos comptes. Les films sont publiés automatiquement.',
    connectYoutube: 'Connecter YouTube', connectTiktok: 'Connecter TikTok',
    connectInstagram: 'Connecter Instagram', connectX: 'Connecter X',
    disconnect: 'Déconnecter', connected: 'Connecté', notConnected: 'Non connecté',
    howTitle: 'Comment ça Marche',
    step1Title: 'Décrivez Votre Histoire', step1Desc: 'Tapez votre idée. Un espion à Tokyo. Une histoire d\'amour à Paris.',
    step2Title: 'L\'IA Crée du Cinéma', step2Desc: 'L\'IA écrit le scénario et génère des scènes cinématographiques.',
    step3Title: 'Votre Voix Narre', step3Desc: 'Enregistrez une fois. L\'IA clone votre voix et narre chaque film.',
    step4Title: 'Téléchargez et Partagez', step4Desc: 'Obtenez votre film HD en minutes.',
    simplePricing: 'Tarification Simple', pricingSub: 'Payez par film. Sans abonnement. Les crédits n\'expirent jamais.',
    dashTitle: 'Mes Films', noFilms: 'Pas encore de films.',
    seconds: 'secondes', minute: 'minute', minutes: 'minutes', scenes: 'scènes',
    back: '← Retour',
  });

  T.ja = Object.assign({}, T.en, {
    menu: '☰', home: '🏠 ホーム', createFilm: '✨ 映画を作る', myFilms: '🎬 マイフィルム',
    addCredits: '💎 クレジット追加', profile: '👤 プロフィール', invite: '🔗 友達を招待',
    socials: '📱 ソーシャル連携',
    howItWorks: '❓ 使い方', privacy: 'プライバシー', terms: '利用規約', contact: 'お問い合わせ',
    logIn: '🔑 ログイン', logOut: '🚪 ログアウト',
    heroTagline: '物語を書く。映画を手に入れる。', heroSub: 'AIシネマ — あなたの声でナレーション。',
    createYourFilm: '映画を作成',
    setupTitle: '声の設定', setupSub: '一度声を録音。AIがクローンしてすべての映画をナレーション。',
    speakNaturally: '10〜30秒間自然に話してください。',
    holdToRecord: '押し続けて録音', continue_: '続ける',
    voiceEncrypted: 'あなたの声は暗号化され、共有されません。',
    createAccount: 'アカウントを作成', welcomeBack: 'おかえりなさい',
    email: 'メール', password: 'パスワード（8文字以上）',
    signUp: '登録', alreadyHaveAccount: 'アカウントをお持ちですか？',
    noAccount: 'アカウントがない？', forgotPassword: 'パスワードを忘れた？',
    resetPassword: 'パスワードリセット', sendResetCode: 'コードを送信',
    enterCode: 'メールのコードを入力', resetCode: 'リセットコード',
    newPassword: '新しいパスワード（8文字以上）', resetBtn: 'パスワードリセット',
    backToLogin: 'ログインに戻る',
    createTitle: '映画を作成', language: '言語', mood: 'ムード', yourStory: 'あなたの物語',
    storyPlaceholder: '1920年代のパリで探偵が絵画に隠された秘密のメッセージを発見...',
    filmDuration: '映画の長さ', previewScript: '脚本プレビュー — 無料',
    previewHint: 'クレジットを使う前に脚本をプレビュー。',
    screenplayTitle: 'あなたの脚本', createFullFilm: '🎥 映画を完成させる',
    usesCredits: '長さに応じてクレジットを使用。', editStory: '← 物語を編集',
    creatingFilm: '映画を作成中', writingScript: '脚本を書く',
    filmingScenes: 'シーンを撮影', recordingVoice: '声を録音',
    stitchingFilm: '映画を組み立て', complete: '完成',
    renderPatience: '数分かかる場合があります。映画が完成したらメールでお知らせします。',
    filmReady: '映画が完成しました', shareFilm: '映画をシェア',
    downloadMp4: '⬇ MP4ダウンロード', createAnother: '別の映画を作る',
    addCreditsTitle: 'クレジット追加', yourBalance: '残高', chooseAmount: '金額を選択',
    creditHint: '$1 = 1クレジット · クレジットは期限なし',
    whatCreditsBuy: 'クレジットで買えるもの', addCreditsBtn: 'クレジット追加', minimum: '最低$10',
    profileTitle: 'マイプロフィール', memberSince: '登録日', credits: 'クレジット',
    voice: '声', voiceCloned: 'クローン済 ✓', voiceNotSet: '未録音', reRecord: '再録音', add: '+ 追加',
    inviteTitle: '友達を招待', inviteSub: '友達が最初の映画を作ると5クレジット獲得。',
    yourReferralLink: '紹介リンク', copyLink: 'リンクをコピー', shareVia: '共有方法',
    socialsTitle: 'ソーシャル連携', socialsSub: 'アカウントを接続。映画が完成したら自動投稿。',
    connectYoutube: 'YouTubeを接続', connectTiktok: 'TikTokを接続',
    connectInstagram: 'Instagramを接続', connectX: 'Xを接続',
    disconnect: '切断', connected: '接続済み', notConnected: '未接続',
    howTitle: '使い方',
    step1Title: '物語を説明', step1Desc: 'アイデアを入力。東京のスパイ。パリの恋物語。',
    step2Title: 'AIがシネマを作成', step2Desc: 'AIが脚本を書き、映画のシーンを生成。',
    step3Title: 'あなたの声でナレーション', step3Desc: '一度録音。AIがあなたの声をクローンして各映画をナレーション。',
    step4Title: 'ダウンロード＆シェア', step4Desc: 'HD映画を数分で取得。',
    simplePricing: 'シンプルな料金', pricingSub: '映画ごとに支払い。サブスクなし。クレジット無期限。',
    dashTitle: 'マイフィルム', noFilms: 'まだ映画がありません。',
    seconds: '秒', minute: '分', minutes: '分', scenes: 'シーン',
    back: '← 戻る',
  });

  T.de = Object.assign({}, T.en, {
    menu: '☰', home: '🏠 Startseite', createFilm: '✨ Film Erstellen', myFilms: '🎬 Meine Filme',
    addCredits: '💎 Credits Hinzufügen', profile: '👤 Profil', invite: '🔗 Freunde Einladen',
    socials: '📱 Social-Konten',
    howItWorks: '❓ So Funktioniert\'s', privacy: 'Datenschutz', terms: 'AGB', contact: 'Kontakt',
    logIn: '🔑 Anmelden', logOut: '🚪 Abmelden',
    heroTagline: 'Schreib eine Geschichte. Bekomme einen Film.',
    heroSub: 'KI-Kino — erzählt mit deiner Stimme.',
    createYourFilm: 'Erstelle Deinen Film',
    setupTitle: 'Stimme Einrichten', setupSub: 'Nimm deine Stimme einmal auf. KI klont sie für alle deine Filme.',
    speakNaturally: 'Sprich natürlich für 10–30 Sekunden.',
    holdToRecord: 'Halten zum Aufnehmen', continue_: 'Weiter',
    voiceEncrypted: 'Deine Stimme ist verschlüsselt und wird nie geteilt.',
    createAccount: 'Konto erstellen', welcomeBack: 'Willkommen zurück',
    email: 'E-Mail', password: 'Passwort (8+ Zeichen)',
    signUp: 'Registrieren', alreadyHaveAccount: 'Bereits ein Konto?',
    noAccount: 'Kein Konto?', forgotPassword: 'Passwort vergessen?',
    resetPassword: 'Passwort zurücksetzen', sendResetCode: 'Code Senden',
    enterCode: 'Code aus der E-Mail eingeben', resetCode: 'Reset-Code',
    newPassword: 'Neues Passwort (8+ Zeichen)', resetBtn: 'Passwort Zurücksetzen',
    backToLogin: 'Zurück zum Login',
    createTitle: 'Erstelle Deinen Film', language: 'Sprache', mood: 'Stimmung', yourStory: 'Deine Geschichte',
    storyPlaceholder: 'Ein Detektiv im Paris der 1920er entdeckt eine geheime Nachricht in einem Gemälde...',
    filmDuration: 'Filmdauer', previewScript: 'Drehbuch Vorschau — Kostenlos',
    previewHint: 'Vorschau deines Drehbuchs vor dem Ausgeben von Credits.',
    screenplayTitle: 'Dein Drehbuch', createFullFilm: '🎥 Kompletten Film Erstellen',
    usesCredits: 'Verwendet Credits je nach Länge.', editStory: '← Geschichte Bearbeiten',
    creatingFilm: 'Dein Film Wird Erstellt', writingScript: 'Drehbuch Schreiben',
    filmingScenes: 'Szenen Filmen', recordingVoice: 'Stimme Aufnehmen',
    stitchingFilm: 'Film Zusammenfügen', complete: 'Fertig',
    renderPatience: 'Dies kann einige Minuten dauern. Wir senden dir eine E-Mail wenn dein Film fertig ist.',
    filmReady: 'Dein Film Ist Fertig', shareFilm: 'Teile Deinen Film',
    downloadMp4: '⬇ MP4 Herunterladen', createAnother: 'Weiteren Film Erstellen',
    addCreditsTitle: 'Credits Hinzufügen', yourBalance: 'Dein Guthaben', chooseAmount: 'Betrag Wählen',
    creditHint: '1$ = 1 Credit · Credits verfallen nie',
    whatCreditsBuy: 'Was Credits Kaufen', addCreditsBtn: 'Credits Hinzufügen', minimum: 'Minimum 10$',
    profileTitle: 'Mein Profil', memberSince: 'Mitglied seit', credits: 'Credits',
    voice: 'Stimme', voiceCloned: 'Geklont ✓', voiceNotSet: 'Nicht aufgenommen', reRecord: 'Neu aufnehmen', add: '+ Hinzufügen',
    inviteTitle: 'Freunde Einladen', inviteSub: 'Verdiene 5 Credits für jeden Freund der seinen ersten Film erstellt.',
    yourReferralLink: 'Dein Empfehlungslink', copyLink: 'Link Kopieren', shareVia: 'Teilen über',
    socialsTitle: 'Social-Konten', socialsSub: 'Verbinde deine Konten. Filme werden automatisch gepostet.',
    connectYoutube: 'YouTube verbinden', connectTiktok: 'TikTok verbinden',
    connectInstagram: 'Instagram verbinden', connectX: 'X verbinden',
    disconnect: 'Trennen', connected: 'Verbunden', notConnected: 'Nicht verbunden',
    howTitle: 'So Funktioniert\'s',
    step1Title: 'Beschreibe Deine Geschichte', step1Desc: 'Tippe deine Idee ein. Ein Spion in Tokio. Eine Liebesgeschichte in Paris.',
    step2Title: 'KI Erstellt Kino', step2Desc: 'KI schreibt das Drehbuch und generiert filmische Szenen.',
    step3Title: 'Deine Stimme Erzählt', step3Desc: 'Einmal aufnehmen. KI klont deine Stimme und erzählt jeden Film.',
    step4Title: 'Herunterladen & Teilen', step4Desc: 'Bekomme deinen HD-Film in Minuten.',
    simplePricing: 'Einfache Preise', pricingSub: 'Zahle pro Film. Kein Abo. Credits verfallen nie.',
    dashTitle: 'Meine Filme', noFilms: 'Noch keine Filme.',
    seconds: 'Sekunden', minute: 'Minute', minutes: 'Minuten', scenes: 'Szenen',
    back: '← Zurück',
  });

  T.it = Object.assign({}, T.en, {
    home: '🏠 Home', createFilm: '✨ Crea Film', myFilms: '🎬 I Miei Film',
    addCredits: '💎 Aggiungi Crediti', profile: '👤 Profilo', invite: '🔗 Invita Amici',
    socials: '📱 Social', howItWorks: '❓ Come Funziona', logIn: '🔑 Accedi', logOut: '🚪 Esci',
    heroTagline: 'Scrivi una storia. Ottieni un film.', heroSub: 'Cinema AI — narrato con la tua voce.',
    createYourFilm: 'Crea il Tuo Film', setupTitle: 'Configura la Tua Voce',
    password: 'Password (8+ caratteri)', newPassword: 'Nuova password (8+ caratteri)',
    continue_: 'Continua', signUp: 'Registrati', createTitle: 'Crea il Tuo Film',
    socialsTitle: 'Account Social', socialsSub: 'Collega i tuoi account. I film vengono pubblicati automaticamente.',
    connectYoutube: 'Collega YouTube', connectTiktok: 'Collega TikTok',
    connectInstagram: 'Collega Instagram', connectX: 'Collega X',
    disconnect: 'Disconnetti', connected: 'Connesso', notConnected: 'Non connesso',
    back: '← Indietro',
  });

  T.pt = Object.assign({}, T.en, {
    home: '🏠 Início', createFilm: '✨ Criar Filme', myFilms: '🎬 Meus Filmes',
    addCredits: '💎 Adicionar Créditos', profile: '👤 Perfil', invite: '🔗 Convidar Amigos',
    socials: '📱 Redes Sociais', howItWorks: '❓ Como Funciona', logIn: '🔑 Entrar', logOut: '🚪 Sair',
    heroTagline: 'Escreva uma história. Receba um filme.', heroSub: 'Cinema IA — narrado com sua voz.',
    createYourFilm: 'Crie Seu Filme', setupTitle: 'Configure Sua Voz',
    password: 'Senha (8+ caracteres)', newPassword: 'Nova senha (8+ caracteres)',
    continue_: 'Continuar', signUp: 'Cadastrar', createTitle: 'Crie Seu Filme',
    socialsTitle: 'Redes Sociais', socialsSub: 'Conecte suas contas. Os filmes são publicados automaticamente.',
    connectYoutube: 'Conectar YouTube', connectTiktok: 'Conectar TikTok',
    connectInstagram: 'Conectar Instagram', connectX: 'Conectar X',
    disconnect: 'Desconectar', connected: 'Conectado', notConnected: 'Não conectado',
    back: '← Voltar',
  });

  T.ko = Object.assign({}, T.en, {
    home: '🏠 홈', createFilm: '✨ 영화 만들기', myFilms: '🎬 내 영화',
    addCredits: '💎 크레딧 추가', profile: '👤 프로필', invite: '🔗 친구 초대',
    socials: '📱 소셜 계정', howItWorks: '❓ 사용 방법', logIn: '🔑 로그인', logOut: '🚪 로그아웃',
    heroTagline: '이야기를 쓰세요. 영화를 받으세요.', heroSub: 'AI 시네마 — 당신의 목소리로 내레이션.',
    createYourFilm: '영화 만들기', password: '비밀번호 (8자 이상)', newPassword: '새 비밀번호 (8자 이상)',
    continue_: '계속', signUp: '가입',
    socialsTitle: '소셜 계정', socialsSub: '계정을 연결하세요. 영화가 완성되면 자동으로 게시됩니다.',
    connectYoutube: 'YouTube 연결', connectTiktok: 'TikTok 연결',
    connectInstagram: 'Instagram 연결', connectX: 'X 연결',
    disconnect: '연결 해제', connected: '연결됨', notConnected: '연결 안됨',
    back: '← 뒤로',
  });

  T.zh = Object.assign({}, T.en, {
    home: '🏠 首页', createFilm: '✨ 创建电影', myFilms: '🎬 我的电影',
    addCredits: '💎 添加积分', profile: '👤 个人资料', invite: '🔗 邀请朋友',
    socials: '📱 社交账号', howItWorks: '❓ 使用方法', logIn: '🔑 登录', logOut: '🚪 退出',
    heroTagline: '写一个故事。获得一部电影。', heroSub: 'AI电影 — 用你的声音叙述。',
    createYourFilm: '创建你的电影', password: '密码（8位以上）', newPassword: '新密码（8位以上）',
    continue_: '继续', signUp: '注册',
    socialsTitle: '社交账号', socialsSub: '连接您的账号。影片完成后自动发布。',
    connectYoutube: '连接YouTube', connectTiktok: '连接TikTok',
    connectInstagram: '连接Instagram', connectX: '连接X',
    disconnect: '断开', connected: '已连接', notConnected: '未连接',
    back: '← 返回',
  });

  T.hi = Object.assign({}, T.en, {
    home: '🏠 होम', createFilm: '✨ फिल्म बनाएं', myFilms: '🎬 मेरी फिल्में',
    addCredits: '💎 क्रेडिट जोड़ें', profile: '👤 प्रोफाइल', invite: '🔗 दोस्तों को आमंत्रित करें',
    socials: '📱 सोशल अकाउंट', howItWorks: '❓ कैसे काम करता है', logIn: '🔑 लॉग इन', logOut: '🚪 लॉग आउट',
    heroTagline: 'एक कहानी लिखो। एक फिल्म पाओ।', heroSub: 'AI सिनेमा — आपकी आवाज में।',
    createYourFilm: 'अपनी फिल्म बनाएं', password: 'पासवर्ड (8+ अक्षर)', newPassword: 'नया पासवर्ड (8+ अक्षर)',
    continue_: 'जारी रखें', signUp: 'साइन अप',
    socialsTitle: 'सोशल अकाउंट', socialsSub: 'अपने अकाउंट कनेक्ट करें। फिल्में अपने आप पोस्ट होंगी।',
    connectYoutube: 'YouTube जोड़ें', connectTiktok: 'TikTok जोड़ें',
    connectInstagram: 'Instagram जोड़ें', connectX: 'X जोड़ें',
    disconnect: 'हटाएं', connected: 'जुड़ा हुआ', notConnected: 'जुड़ा नहीं',
    back: '← वापस',
  });

  T.ar = Object.assign({}, T.en, {
    home: '🏠 الرئيسية', createFilm: '✨ إنشاء فيلم', myFilms: '🎬 أفلامي',
    addCredits: '💎 إضافة رصيد', profile: '👤 الملف الشخصي', invite: '🔗 دعوة أصدقاء',
    socials: '📱 حسابات التواصل', howItWorks: '❓ كيف يعمل', logIn: '🔑 تسجيل الدخول', logOut: '🚪 تسجيل الخروج',
    heroTagline: 'اكتب قصة. احصل على فيلم.', heroSub: 'سينما الذكاء الاصطناعي — بصوتك.',
    createYourFilm: 'أنشئ فيلمك', password: 'كلمة المرور (8+ أحرف)', newPassword: 'كلمة مرور جديدة (8+ أحرف)',
    continue_: 'متابعة', signUp: 'تسجيل',
    socialsTitle: 'حسابات التواصل الاجتماعي', socialsSub: 'اربط حساباتك. تُنشر الأفلام تلقائياً.',
    connectYoutube: 'ربط YouTube', connectTiktok: 'ربط TikTok',
    connectInstagram: 'ربط Instagram', connectX: 'ربط X',
    disconnect: 'قطع الاتصال', connected: 'متصل', notConnected: 'غير متصل',
    back: '← رجوع',
  });

  T.ru = Object.assign({}, T.en, {
    home: '🏠 Главная', createFilm: '✨ Создать Фильм', myFilms: '🎬 Мои Фильмы',
    addCredits: '💎 Добавить Кредиты', profile: '👤 Профиль', invite: '🔗 Пригласить Друзей',
    socials: '📱 Соцсети', howItWorks: '❓ Как Это Работает', logIn: '🔑 Войти', logOut: '🚪 Выйти',
    heroTagline: 'Напишите историю. Получите фильм.', heroSub: 'AI кино — озвучено вашим голосом.',
    createYourFilm: 'Создайте Свой Фильм', password: 'Пароль (8+ символов)', newPassword: 'Новый пароль (8+ символов)',
    continue_: 'Продолжить', signUp: 'Регистрация',
    socialsTitle: 'Соцсети', socialsSub: 'Подключите аккаунты. Фильмы публикуются автоматически.',
    connectYoutube: 'Подключить YouTube', connectTiktok: 'Подключить TikTok',
    connectInstagram: 'Подключить Instagram', connectX: 'Подключить X',
    disconnect: 'Отключить', connected: 'Подключено', notConnected: 'Не подключено',
    back: '← Назад',
  });

  // ── Translation Engine ──

  RT.t = function (key) {
    var lang = RT.language || 'en';
    var dict = T[lang] || T.en;
    return dict[key] !== undefined ? dict[key] : (T.en[key] !== undefined ? T.en[key] : key);
  };

  RT.applyLanguage = function () {
    // Menu items
    var menuMap = {
      'menu-home':     'home',
      'menu-create':   'createFilm',
      'menu-films':    'myFilms',
      'menu-credits':  'addCredits',
      'menu-profile':  'profile',
      'menu-invite':   'invite',
      'menu-socials':  'socials',
      'menu-how':      'howItWorks',
      'menu-auth':     'logIn',
      'menu-logout':   'logOut',
    };
    Object.keys(menuMap).forEach(function (id) {
      var el = RT.$(id);
      if (el) el.textContent = RT.t(menuMap[id]);
    });

    // data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = RT.t(key);
      } else {
        el.textContent = RT.t(key);
      }
    });

    // Landing
    var heroTagline = document.querySelector('.hero-tagline');
    if (heroTagline) heroTagline.textContent = RT.t('heroTagline');
    var heroSub = document.querySelector('.hero-sub');
    if (heroSub) heroSub.textContent = RT.t('heroSub');
    var startBtn = RT.$('btn-start');
    if (startBtn) startBtn.textContent = RT.t('createYourFilm');

    // RTL languages
    var rtlLangs = ['ar'];
    document.documentElement.dir = rtlLangs.indexOf(RT.language) !== -1 ? 'rtl' : 'ltr';

    // Mood chips
    if (RT.MOODS) {
      var chips = document.querySelectorAll('#mood-chips .chip');
      var moodIcons = {
        calm: '🌅', cozy: '☕', adventure: '🔥', romantic: '❤️',
        suspense: '🌙', motivational: '💪', heartwarming: '💛', dramatic: '🎭',
        thriller: '🔪', action: '💥', spiritual: '🕊', comedy: '😂',
        horror: '👻', mystery: '🔍', inspirational: '⭐',
      };
      chips.forEach(function (chip) {
        var m = chip.getAttribute('data-v');
        if (m) chip.textContent = (moodIcons[m] || '') + ' ' + RT.t(m);
      });
    }
  };

  RT.applyLanguage();

  var origSetLang = RT.setLanguage;
  RT.setLanguage = function (code) {
    origSetLang(code);
    RT.applyLanguage();
  };

})();
