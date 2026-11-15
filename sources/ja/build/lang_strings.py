# -*- coding: utf-8 -*-
"""Book-level strings of the German and Russian editions (cover, half-title, TOC, running heads, epigraphs)."""

STR = {
    'de': dict(
        title='Videoproduktion: Ein Praxislehrbuch',
        author='Jia Ahn',
        kicker='VIDEOPRODUKTION · EIN PRAXISLEHRBUCH',
        PART='TEIL', PROLOGUE='PROLOG',
        part_re=[r'(\bTEIL\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
        part_small_re=r'(<small>TEIL</small>)(\d{2})',
        fig_re=r'Abb\.', fig_ref_re=r'\bAbb\.',
        cover_h1='Video-<br>produktion',
        cover_sub_hidden='Ein Praxislehrbuch in 13 Kapiteln',
        cover_k='EIN PRAXISLEHRBUCH',
        cover_sub='Dreizehn Kapitel von der Planung bis zur Abgabe – für Seminarraum und Set',
        ht_h1='Videoproduktion',
        ht_sub='Ein Praxislehrbuch in 13 Kapiteln – von der Planung bis zur Abgabe',
        back_lead='Bei Video geht es nicht ums Drehen.<br>Es geht darum, zu entscheiden, was man zeigt und was man verbirgt.',
        back_body='Vom einzelnen Storyboard-Feld bis zur LED-Fassade, von der ersten Drehzeit bis zum ersten Showreel. Dieses Buch ist kein Katalog von Techniken, sondern die Reihenfolge der Entscheidungen, die am Set fallen. Die Praxis kommt zuerst, die Theorie folgt, und jede Abbildung wurde neu gezeichnet, um eine Frage zu beantworten: Warum dreht man es so? Jetzt, da generative KI zum Arbeitsablauf gehört, ist es ein Buch zum Üben dessen, was sich nicht ändert: der Blick, das Versprechen, der letzte Schliff.',
        contents='Inhalt', front_matter='Vorspann', prologue='Prolog', dash=' – ', feature='Spezial',
        note='NOTIZEN', memo='NOTIZEN', memo_pro='NOTIZEN · PROLOG',
        rh_left='Videoproduktion',
        appendix='Anhang', appW_crumb='Generierte Bilder', appW_h2='Generierte Referenzfotos und ihre Prompts',
        appW_lead='ID, Platzierung und Prompt der {n} Referenzfotos, die für diese Ausgabe erzeugt wurden. Alle entstanden ohne reale Personen, Marken oder Logos; derselbe Prompt liefert ein ähnliches, kein identisches Bild. Die Prompts stehen im englischen Original.',
        appW_used='Verwendet', appW_prompt='Prompt',
        css='.qa dt::before{content:"F"}\n'
            # "How to read this book": the eight cards fit on one page in German at a slightly tighter setting
            '#notes .card{padding:3.2mm 3.8mm;font-size:8.1pt;line-height:1.55}#notes .card h4{margin-bottom:1.6mm}\n'
            # "30 questions": slightly tighter spacing so the German list ends on its second page (no two-line spill)
            '#faq-1 .faq dt,#faq-2 .faq dt{margin-top:2.15mm}\n',
        epi={
            1: 'Die Kamera ist keine Maschine zum Sehen.<br>Sie ist eine Maschine zum Auswählen.',
            2: 'Ein guter Dreh ist<br>am Abend davor fertig.',
            3: 'Wer Licht in Zahlen fassen kann,<br>für den ist die Kamera keine Blackbox mehr.',
            4: 'Beim Licht geht es nicht ums Aufhellen.<br>Es geht darum, das Dunkel zu setzen.',
            5: 'Ein Schnitt ist nicht die Stelle, an der man trennt.<br>Er ist die Stelle, an der das Publikum atmet.',
            6: 'Sobald das Bild die Wand verlässt,<br>wird der Betrachter zur Kamera.',
            7: 'Ein Werbespot verkauft keine fünfzehn Sekunden.<br>Er verkauft, was danach bleibt.',
            8: 'Algorithmen haben keinen Geschmack.<br>Geschmack bleibt Menschenarbeit.',
            9: 'Märkte folgen nicht der Technik.<br>Sie folgen Gewohnheiten.',
            10: 'Ein Portfolio ist keine Liste dessen, was Ihnen gelungen ist.<br>Es ist der Beweis, dass man Ihnen den nächsten Auftrag anvertrauen kann.',
            11: 'Was bleibt, wenn sich die Werkzeuge ändern –<br>der Blick, das Versprechen, der letzte Schliff.',
            12: 'Jedes Video beginnt mit einer Frage:<br>Wer schaut zu – und warum?',
            13: 'Technik ist Material.<br>Das Werk entsteht im Umgang damit.',
            14: 'Was am Set notiert wird,<br>hält länger als jedes Gedächtnis.',
        },
    ),
    'ru': dict(
        title='Видеопроизводство: практический учебник',
        author='Ан Джиа',
        kicker='ВИДЕОПРОИЗВОДСТВО · ПРАКТИЧЕСКИЙ УЧЕБНИК',
        PART='ЧАСТЬ', PROLOGUE='ПРОЛОГ',
        part_re=[r'(\b(?:ЧАСТЬ|ЧАСТИ|ЧАСТЯХ|ЧАСТЯМ|ЧАСТЬЮ|ЧАСТЕЙ)\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?',
                 r'(\b(?:часть|части|частей|частях|частям|частью)\s)(\d{2})(?:(\s?[~–-]\s?)(\d{2}))?'],
        part_small_re=r'(<small>ЧАСТЬ</small>)(\d{2})',
        fig_re=r'Рис\.', fig_ref_re=r'\b[Рр]ис\.',
        cover_h1='Видео-<br>производство',
        cover_sub_hidden='Практический учебник в 13 главах',
        cover_k='ПРАКТИЧЕСКИЙ УЧЕБНИК',
        cover_sub='Тринадцать глав — от замысла до сдачи материалов, для аудитории и съёмочной площадки',
        ht_h1='Видеопроизводство',
        ht_sub='Практический учебник в 13 главах — от замысла до сдачи материалов',
        back_lead='Видео — это не съёмка.<br>Это выбор: что показать, а что скрыть.',
        back_body='От одного кадра раскадровки до светодиодного фасада, от первого времени сбора до первого шоурила. Эта книга — не каталог приёмов, а порядок решений, которые принимаются на съёмочной площадке. Сначала практика, затем теория, и каждая иллюстрация перерисована, чтобы ответить на один вопрос: почему снимать именно так? Теперь, когда генеративный ИИ стал частью рабочего процесса, это книга для тренировки того, что не меняется: взгляда, обещания, завершённости.',
        contents='Содержание', front_matter='Вводная часть', prologue='Пролог', dash=' — ', feature='Спецраздел',
        note='ЗАМЕТКИ', memo='ЗАМЕТКИ', memo_pro='ЗАМЕТКИ · ПРОЛОГ',
        rh_left='Видеопроизводство',
        appendix='Приложение', appW_crumb='Сгенерированные изображения', appW_h2='Сгенерированные референсные фото и их промпты',
        appW_lead='Идентификатор, место в книге и промпт для каждого из {n} референсных фото, созданных для этого издания. Все они сгенерированы без реальных людей, брендов и логотипов; один и тот же промпт даёт похожее, но не идентичное изображение. Промпты приведены на языке оригинала (английском).',
        appW_used='Исп.', appW_prompt='Промпт',
        css='.qa dt::before{content:"В"}\n'
            # "How to read this book": the eight cards fit on one page in Russian at a tighter setting
            '#notes .card{padding:2.8mm 3.4mm;font-size:7.8pt;line-height:1.5}#notes .card h4{margin-bottom:1.2mm;font-size:9.2pt}'
            '#notes .card li{margin-bottom:.6mm}\n',
        epi={
            1: 'Камера — не машина для того, чтобы видеть.<br>Это машина для того, чтобы выбирать.',
            2: 'Хорошая съёмка заканчивается<br>накануне вечером.',
            3: 'Когда вы умеете считать свет,<br>камера перестаёт быть чёрным ящиком.',
            4: 'Свет нужен не для того, чтобы осветить.<br>Он нужен, чтобы расставить темноту.',
            5: 'Склейка — не место, где режут.<br>Это место, где зритель делает вдох.',
            6: 'Как только изображение сходит со стены,<br>зритель становится камерой.',
            7: 'Реклама продаёт не пятнадцать секунд.<br>Она продаёт то, что остаётся после них.',
            8: 'У алгоритмов нет вкуса.<br>Вкус — по-прежнему работа человека.',
            9: 'Рынки идут не за технологиями.<br>Они идут за привычками.',
            10: 'Портфолио — не список того, что у вас получилось.<br>Это доказательство, что вам можно доверить следующую работу.',
            11: 'Что остаётся, когда меняются инструменты, —<br>взгляд, обещание, завершённость.',
            12: 'Любое видео начинается с одного вопроса:<br>кто смотрит и зачем?',
            13: 'Технология — это материал.<br>Произведение рождается из того, как вы с ним обращаетесь.',
            14: 'Записи на съёмочной площадке<br>живут дольше памяти.',
        },
    ),
}


def _mk(lang, **kw):
    STR[lang] = kw


_CJK_CSS = (':root{{--serif:"Noto Serif CJK {f}",serif;--sans:"Noto Sans CJK {f}",sans-serif}}\n'
            'body{{line-break:strict;text-align:justify}}\n'
            '*{{word-break:normal!important}}\n')

_mk('zh',
    title='视频制作实务教程', author='Jia Ahn', kicker='VIDEO PRODUCTION · 实务教程',
    PART='PART', PROLOGUE='序章',
    part_re=[r'((?<![A-Za-z])PART\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
    part_small_re=r'(<small>PART</small>)(\d{2})',
    fig_re=r'图', fig_ref_re=r'图',
    cover_h1='视频制作<br>实务教程', cover_sub_hidden='13章实务教程', cover_k='VIDEO PRODUCTION · A PRACTICAL TEXTBOOK',
    cover_sub='从策划到交付，课堂与片场都用得上的13章',
    ht_h1='视频制作实务教程', ht_sub='从策划到交付的13章实务教程',
    back_lead='视频不是拍摄的事，<br>而是选择给人看什么、藏起什么的事。',
    back_body='从一格分镜到LED媒体立面，从第一次通告时间到第一支作品集锦。这本书不是技法的目录，而是片场上做判断的顺序。先练习，后理论；每一张图都重新绘制，只为回答一个问题：为什么要这样拍？在生成式AI进入工作流程的今天，这是一本用来练习那些不变之物的书——眼光、承诺、收尾。',
    contents='目录', front_matter='卷首', prologue='序章', dash=' — ', feature='专题',
    note='笔记', memo='笔记', memo_pro='笔记 · 序章', rh_left='视频制作实务教程',
    appendix='附录', appW_crumb='生成图片', appW_h2='生成的参考照片及其提示词',
    appW_lead='本版所生成的{n}张参考照片的编号、使用位置和提示词。所有图片均不含真实人物、品牌或标志；同一提示词会得到相似但不完全相同的图片。提示词保留英文原文。',
    appW_used='使用', appW_prompt='提示词',
    css=_CJK_CSS.format(f='SC') + '.qa dt::before{content:"问"}\n',
    cjk='SC',
    epi={1: '摄影机不是用来看的机器，<br>而是用来选择的机器。', 2: '好的拍摄，<br>在前一天晚上就已经完成。', 3: '学会给光计数，<br>摄影机就不再是黑箱。',
         4: '布光不是把画面照亮，<br>而是安排黑暗的位置。', 5: '剪辑点不是下刀的地方，<br>而是观众换气的地方。', 6: '画面离开墙壁的那一刻，<br>观众就成了摄影机。',
         7: '广告卖的不是十五秒，<br>而是十五秒之后留下的记忆。', 8: '算法没有品味。<br>品味始终是人的工作。', 9: '市场不跟着技术走，<br>它跟着习惯走。',
         10: '作品集不是你做得好的清单，<br>而是可以把下一份工作交给你的证据。', 11: '工具变了也不会变的——<br>眼光、承诺、收尾。', 12: '每一支视频都从一个问题开始：<br>谁在看，为什么看？',
         13: '技术是材料。<br>作品来自对待材料的态度。', 14: '片场的文件，<br>比记忆留得更久。'})

_mk('ja',
    title='映像制作 実践テキスト', author='アン・ジア', kicker='VIDEO PRODUCTION · 実践テキスト',
    PART='PART', PROLOGUE='プロローグ',
    part_re=[r'((?<![A-Za-z])PART\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
    part_small_re=r'(<small>PART</small>)(\d{2})',
    fig_re=r'図', fig_ref_re=r'図',
    cover_h1='映像制作<br>実践テキスト', cover_sub_hidden='13章の実践テキスト', cover_k='VIDEO PRODUCTION · A PRACTICAL TEXTBOOK',
    cover_sub='企画から納品まで、教室でも現場でも開く13章',
    ht_h1='映像制作 実践テキスト', ht_sub='企画から納品まで、13章の実践テキスト',
    back_lead='映像とは、撮ることではない。<br>何を見せ、何を隠すかを選ぶことだ。',
    back_body='絵コンテの1コマからLEDファサードまで、最初の集合時間から最初のショーリールまで。本書は技法のカタログではなく、現場で下す判断の順序をまとめたものだ。演習を先に、理論は後に置き、すべての図版は「なぜこう撮るのか」に答えるよう描き直した。生成AIが制作工程に入ったいま、変わらないもの――眼、約束、仕上げ――を練習するための本である。',
    contents='目次', front_matter='巻頭', prologue='プロローグ', dash=' — ', feature='特集',
    note='メモ', memo='メモ', memo_pro='メモ · プロローグ', rh_left='映像制作 実践テキスト',
    appendix='付録', appW_crumb='生成画像', appW_h2='生成した参考写真とプロンプト',
    appW_lead='本書のために生成した参考写真{n}点のID、掲載箇所、プロンプトの一覧。いずれも実在の人物、ブランド、ロゴを含まない。同じプロンプトでも、得られるのは似た画像であって同一の画像ではない。プロンプトは英語の原文のまま掲載する。',
    appW_used='掲載', appW_prompt='プロンプト',
    css=_CJK_CSS.format(f='JP') + '.qa dt::before{content:"Q"}\n',
    cjk='JP',
    epi={1: 'カメラは見るための機械ではない。<br>選ぶための機械だ。', 2: 'よい撮影は、<br>前の晩にもう終わっている。', 3: '光を数えられるようになれば、<br>カメラはもうブラックボックスではない。',
         4: '照明とは明るくすることではない。<br>闇を配置することだ。', 5: 'カットは切る場所ではない。<br>観客が息をつく場所だ。', 6: '映像が壁を離れた瞬間、<br>観客がカメラになる。',
         7: '広告が売るのは15秒ではない。<br>15秒のあとに残る記憶だ。', 8: 'アルゴリズムに好みはない。<br>好みは最後まで人の仕事だ。', 9: '市場は技術についていかない。<br>習慣についていく。',
         10: 'ポートフォリオは、うまくできたものの一覧ではない。<br>次の仕事を任せられるという証拠だ。', 11: '道具が変わっても変わらないもの――<br>眼、約束、仕上げ。', 12: 'すべての映像は、ひとつの問いから始まる。<br>誰が、なぜ見るのか。',
         13: '技術は素材だ。<br>作品は、素材を扱う姿勢から生まれる。', 14: '現場の書類は、<br>記憶よりも長く残る。'})

_mk('es',
    title='Producción de video: manual práctico', author='Jia Ahn', kicker='PRODUCCIÓN DE VIDEO · MANUAL PRÁCTICO',
    PART='PARTE', PROLOGUE='PRÓLOGO',
    part_re=[r'(\bPARTE\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
    part_small_re=r'(<small>PARTE</small>)(\d{2})',
    fig_re=r'Fig\.', fig_ref_re=r'\bFig\.',
    cover_h1='Producción<br>de video', cover_sub_hidden='Manual práctico en 13 capítulos', cover_k='MANUAL PRÁCTICO',
    cover_sub='Trece capítulos, de la idea a la entrega, para el aula y para el rodaje',
    ht_h1='Producción de video', ht_sub='Manual práctico en 13 capítulos, de la idea a la entrega',
    back_lead='El video no consiste en grabar.<br>Consiste en elegir qué mostrar y qué ocultar.',
    back_body='De una sola viñeta de storyboard a una fachada LED, de la primera hora de citación al primer showreel. Este libro no es un catálogo de técnicas, sino el orden de las decisiones que se toman en el rodaje. Primero la práctica, después la teoría, y cada figura se ha vuelto a dibujar para responder a una pregunta: ¿por qué se rueda así? Ahora que la IA generativa forma parte del flujo de trabajo, es un libro para practicar lo que no cambia: la mirada, la palabra dada, el acabado.',
    contents='Índice', front_matter='Páginas preliminares', prologue='Prólogo', dash=': ', feature='Especial',
    note='NOTAS', memo='NOTAS', memo_pro='NOTAS · PRÓLOGO', rh_left='Producción de video',
    appendix='Apéndice', appW_crumb='Imágenes generadas', appW_h2='Fotos de referencia generadas y sus prompts',
    appW_lead='Identificador, ubicación y prompt de las {n} fotos de referencia generadas para esta edición. Todas se crearon sin personas, marcas ni logotipos reales; el mismo prompt produce una imagen parecida, no idéntica. Los prompts se reproducen en su original inglés.',
    appW_used='Uso', appW_prompt='Prompt',
    css='.qa dt::before{content:"P"}\n',
    epi={1: 'La cámara no es una máquina de ver.<br>Es una máquina de elegir.', 2: 'Un buen rodaje se termina<br>la noche anterior.', 3: 'Cuando sabes contar la luz,<br>la cámara deja de ser una caja negra.',
         4: 'Iluminar no es dar luz.<br>Es colocar la oscuridad.', 5: 'Un corte no es donde se corta.<br>Es donde el público respira.', 6: 'En cuanto la imagen se separa de la pared,<br>el espectador se convierte en cámara.',
         7: 'Un anuncio no vende quince segundos.<br>Vende lo que queda después.', 8: 'Los algoritmos no tienen gusto.<br>El gusto sigue siendo trabajo humano.', 9: 'Los mercados no siguen a la tecnología.<br>Siguen a los hábitos.',
         10: 'Un portafolio no es la lista de lo que te salió bien.<br>Es la prueba de que se te puede confiar el siguiente trabajo.', 11: 'Lo que no cambia cuando cambian las herramientas:<br>la mirada, la palabra dada, el acabado.', 12: 'Todo video empieza con una pregunta:<br>¿quién lo ve y por qué?',
         13: 'La tecnología es material.<br>La obra nace de cómo lo tratas.', 14: 'Los papeles del rodaje<br>duran más que la memoria.'})

_mk('it',
    title='Produzione video: manuale pratico', author='Jia Ahn', kicker='PRODUZIONE VIDEO · MANUALE PRATICO',
    PART='PARTE', PROLOGUE='PROLOGO',
    part_re=[r'(\bPARTE\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
    part_small_re=r'(<small>PARTE</small>)(\d{2})',
    fig_re=r'Fig\.', fig_ref_re=r'\bFig\.',
    cover_h1='Produzione<br>video', cover_sub_hidden='Manuale pratico in 13 capitoli', cover_k='MANUALE PRATICO',
    cover_sub='Tredici capitoli, dall’idea alla consegna, per l’aula e per il set',
    ht_h1='Produzione video', ht_sub='Manuale pratico in 13 capitoli, dall’idea alla consegna',
    back_lead='Fare video non significa girare.<br>Significa scegliere che cosa mostrare e che cosa nascondere.',
    back_body='Da un solo riquadro di storyboard a una facciata LED, dalla prima convocazione al primo showreel. Questo libro non è un catalogo di tecniche, ma l’ordine delle decisioni che si prendono sul set. Prima la pratica, poi la teoria, e ogni figura è stata ridisegnata per rispondere a una domanda: perché si gira così? Ora che l’IA generativa fa parte del flusso di lavoro, è un libro per esercitare ciò che non cambia: lo sguardo, la parola data, la rifinitura.',
    contents='Indice', front_matter='Pagine iniziali', prologue='Prologo', dash=' – ', feature='Speciale',
    note='NOTE', memo='NOTE', memo_pro='NOTE · PROLOGO', rh_left='Produzione video',
    appendix='Appendice', appW_crumb='Immagini generate', appW_h2='Foto di riferimento generate e relativi prompt',
    appW_lead='Identificativo, posizione e prompt delle {n} foto di riferimento generate per questa edizione. Tutte sono state create senza persone, marchi o loghi reali; lo stesso prompt produce un’immagine simile, non identica. I prompt sono riportati nell’originale inglese.',
    appW_used='Uso', appW_prompt='Prompt',
    css='.qa dt::before{content:"D"}\n',
    epi={1: 'La macchina da presa non è una macchina per vedere.<br>È una macchina per scegliere.', 2: 'Una buona ripresa è finita<br>la sera prima.', 3: 'Quando sai contare la luce,<br>la camera smette di essere una scatola nera.',
         4: 'Illuminare non significa fare luce.<br>Significa disporre il buio.', 5: 'Un taglio non è il punto in cui si taglia.<br>È il punto in cui il pubblico respira.', 6: 'Nel momento in cui l’immagine lascia la parete,<br>lo spettatore diventa la camera.',
         7: 'Uno spot non vende quindici secondi.<br>Vende ciò che resta dopo.', 8: 'Gli algoritmi non hanno gusto.<br>Il gusto resta un lavoro umano.', 9: 'I mercati non seguono la tecnologia.<br>Seguono le abitudini.',
         10: 'Un portfolio non è l’elenco di ciò che ti è riuscito bene.<br>È la prova che ti si può affidare il prossimo lavoro.', 11: 'Ciò che resta quando cambiano gli strumenti:<br>lo sguardo, la parola data, la rifinitura.', 12: 'Ogni video comincia con una domanda:<br>chi guarda, e perché?',
         13: 'La tecnologia è materiale.<br>L’opera nasce da come lo tratti.', 14: 'Le carte del set<br>durano più della memoria.'})

_mk('fr',
    title='Production vidéo : manuel pratique', author='Jia Ahn', kicker='PRODUCTION VIDÉO · MANUEL PRATIQUE',
    PART='PARTIE', PROLOGUE='PROLOGUE',
    part_re=[r'(\bPARTIE\s)(\d{1,2})(?:(\s?[~–-]\s?)(\d{1,2}))?'],
    part_small_re=r'(<small>PARTIE</small>)(\d{2})',
    fig_re=r'Fig\.', fig_ref_re=r'\bFig\.',
    cover_h1='Production<br>vidéo', cover_sub_hidden='Manuel pratique en 13 chapitres', cover_k='MANUEL PRATIQUE',
    cover_sub='Treize chapitres, de l’idée à la livraison, pour la salle de cours et le plateau',
    ht_h1='Production vidéo', ht_sub='Manuel pratique en 13 chapitres, de l’idée à la livraison',
    back_lead='Faire de la vidéo, ce n’est pas filmer.<br>C’est choisir ce que l’on montre et ce que l’on cache.',
    back_body='D’une seule case de storyboard à une façade LED, de la première heure de convocation au premier showreel. Ce livre n’est pas un catalogue de techniques, mais l’ordre des décisions que l’on prend sur un plateau. La pratique d’abord, la théorie ensuite, et chaque figure a été redessinée pour répondre à une question : pourquoi tourner ainsi ? Maintenant que l’IA générative fait partie de la chaîne de travail, c’est un livre pour exercer ce qui ne change pas : le regard, la parole donnée, la finition.',
    contents='Sommaire', front_matter='Pages liminaires', prologue='Prologue', dash=' – ', feature='Dossier',
    note='NOTES', memo='NOTES', memo_pro='NOTES · PROLOGUE', rh_left='Production vidéo',
    appendix='Annexe', appW_crumb='Images générées', appW_h2='Photos de référence générées et leurs prompts',
    appW_lead='Identifiant, emplacement et prompt des {n} photos de référence générées pour cette édition. Toutes ont été créées sans personnes, marques ni logos réels ; un même prompt donne une image proche, jamais identique. Les prompts sont reproduits dans leur version anglaise d’origine.',
    appW_used='Emploi', appW_prompt='Prompt',
    css='.qa dt::before{content:"Q"}\n',
    epi={1: 'La caméra n’est pas une machine à voir.<br>C’est une machine à choisir.', 2: 'Un bon tournage est terminé<br>la veille au soir.', 3: 'Quand on sait compter la lumière,<br>la caméra cesse d’être une boîte noire.',
         4: 'Éclairer, ce n’est pas donner de la lumière.<br>C’est placer l’obscurité.', 5: 'Une coupe n’est pas l’endroit où l’on tranche.<br>C’est l’endroit où le public respire.', 6: 'Dès que l’image quitte le mur,<br>le spectateur devient la caméra.',
         7: 'Une publicité ne vend pas quinze secondes.<br>Elle vend ce qui reste après.', 8: 'Les algorithmes n’ont pas de goût.<br>Le goût reste un travail humain.', 9: 'Les marchés ne suivent pas la technologie.<br>Ils suivent les habitudes.',
         10: 'Un portfolio n’est pas la liste de ce que vous avez réussi.<br>C’est la preuve qu’on peut vous confier le prochain travail.', 11: 'Ce qui reste quand les outils changent :<br>le regard, la parole donnée, la finition.', 12: 'Toute vidéo commence par une question :<br>qui regarde, et pourquoi ?',
         13: 'La technique est un matériau.<br>L’œuvre naît de la façon dont on le travaille.', 14: 'Les documents de plateau<br>durent plus longtemps que la mémoire.'})

import re as _re
def _fr_nb(v):
    if isinstance(v, str):
        v = _re.sub(r' ([:;!?»])', ' \\1', v); v = v.replace('« ', '« ')
    elif isinstance(v, dict):
        v = {k: _fr_nb(x) for k, x in v.items()}
    return v
STR['fr'] = {k: (v if k in ('css', 'part_re', 'part_small_re', 'fig_re', 'fig_ref_re', 'dash') else _fr_nb(v)) for k, v in STR['fr'].items()}

for _l in ('zh', 'ja', 'es', 'it', 'fr'):
    STR[_l]['css'] += '.faq dt{break-after:avoid}\n'
for _l in ('es', 'it', 'fr'):
    # front matter that ran onto a second page: author's note and "How to read this book" at a slightly tighter setting
    STR[_l]['css'] += ('#author-note p{font-size:9pt;line-height:1.62;margin-bottom:2mm}#author-note h1{font-size:18pt;margin-bottom:5mm}\n'
                       '#notes .card{padding:2.8mm 3.4mm;font-size:7.8pt;line-height:1.5}#notes .card h4{margin-bottom:1.2mm;font-size:9.2pt}'
                       '#notes .card li{margin-bottom:.6mm}\n')
