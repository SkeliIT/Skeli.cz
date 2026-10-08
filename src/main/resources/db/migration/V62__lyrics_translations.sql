-- Lyrics translated into English, German, Ukrainian and Vietnamese, and every song title in those
-- languages (lyrics.title, V61). Existing translations are kept; a title is only filled where empty.

-- en
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', NULL, 'I want a gemstone, I don''t want a Pamela hoe,
but if she wants, I can give you some smoke,
she''ll happily set up a pyramid for me, I''ll put it in, then I''m gone,
my bro comes, takes over the baton, don''t act like you were never on drugs,
I don''t believe a word you say, it''s raining in your shoes again, more than one dick in your mouth,
that''s what you do your promo on, don''t play innocent with me,
RDM or Zoom, then we send you on to the next dogs, then we send you on to the next dogs,
RDM or Zoom, then we send you on to the next dogs.

She took him in her mouth here and over there,
barking into the doghouse, it''ll drag you to the bottom,
her only friends are on OnlyFans,
she''s got no limits, gives herself to everyone.

Handbags, little shoes and a new ride,
a hand job, a blow job, the money''s made,
the oldest trade in the world feeds you now,
your photos have flooded the net.

The body''s in circulation, the head is offline,
they take their hands off you as soon as they get to know you,
zero values, you''re no lady,
what does your mum say about your pussy?

Send her greetings, wave with a dildo,
you ran out of character, you sort it out with a pilsner,
everyone takes just a little piece of you,
the databases won''t delete themselves.

You don''t care, as long as you''re making that cash,
easy money for your body, dignity bye-bye.
You don''t care, as long as you''re making that cash,
easy money for your body, dignity bye-bye.

The bitch thinks she can screw me over, but she won''t pull it off,
she wanted me to come all over her, but I tell her: babe, no, no, no, no,
I''d never be with someone like that, I''m not crazy, I''d never betray myself.
I''d like to know where your value went,
it vanished when you were chasing dicks for money,
so the word "woman" means nothing to you,
and dressing well means nothing at all.

Zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
let''s go, zoom, zoom,
put it on at the show and let everybody hear it, let the speakers bang,
this track isn''t sweet, it isn''t candy, it really isn''t candy,
girl, shut your mouth, you don''t get a say, the devils are talking now,
the other one can step aside and wait for me till the evening,
the girl''s handing out weed, thinks nobody knows, thinks she''ll keep it a secret,
the people around her told me, she''ll give it to everyone, she''ll turn into a stupid cow,
but one day the lava will burn her, and I''ll be dancing tango and waltz.

She''s a stupid cow and she loves making drama,
demons, hastiness, she''s riding the wave, they turn their backs,
she breaks down on booze, she''ll do anyone,
and her self-respect is gone, she isn''t that sweet anymore.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Zoom - Drama%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Tick Tock', 'Maybe you''ve already forgotten, but I''m still here,
we''re fighting with life, clearing our own way.
I sweep in front of my own door, I don''t push to the front,
I watch from a distance how the kids draw their lines.

Fried since fifteen, life must be a blast,
sniffing it up their snouts, locking up their cage.
Tick tock, tick tock — the big fuck is coming,
with the realisation that all that''s left of the brain is mush.
You keep looking over your shoulder, the paranoia''s got you.

You look out for the cops, what if they came,
they''d take your kratom, the meth as well.
They''d empty out all those bags,
you want to vanish fast like Fittipaldi.
All your piles of it — what is reality?
Your life, a huge calamity, Mortal Kombat, fatality.
They lead you to their Octavia, you feel the cuffs on your hands,
you can''t see the sky above you, below you there''s lava.
I saw it when I came back from fishing,
you feel your fear, a crazy trip,
here comes the drop, you''re tasting shit.

You want to fight everyone, it''s that empty grip''s fault,
you don''t know when to say stop, you don''t learn from your own mistakes.
You can start digging your grave, then there''ll be no strength left,
hopefully it won''t be a shock to you that you can''t turn the tide of things.

It grinds you down by itself, grinds, grinds, grinds by itself,
it takes the charge out of you, takes, takes the charge.
It eats up your soul, it eats up your face,
what you plant is what you get,
your mug looks like a herbarium,
you''re crumbling like a sphinx.

You want to fight everyone,
it''s that empty grip''s fault,
you don''t know when to say stop,
you don''t learn from your own mistakes.
You can start digging your grave,
then there''ll be no strength left,
hopefully it won''t be a shock to you
that you can''t turn the tide of things.

Tick tock, tick tock, your time is running out,
tick tock, tick tock, you''re a lost cause,
tick tock, tick tock, endless paranoia.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tik Tak%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tik Tak%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tick Tock' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'A Thousand Pieces', 'happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down

happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down
I''m searching for myself and I don''t know where to start
I''m missing a piece of the organ that''s meant to drive me forward
I don''t know what''s left of me, if it''s even still me
a body without a soul and a soul without a body
they tore me into a thousand pieces and then moved on to the next house

moved on to the next house

happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down

happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down

and now I''m looking for the footprints I once walked in
I don''t know what happened that I forgot it all
I threw away the compass that showed me the right way
I let myself drift with the current like a boat without oars
and time flows and I know I can never get wasted time back
the doors I opened are almost closed now
maybe I still have a chance to make it, maybe it''s not lost

happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down

happy tracks really don''t come out of me well right now
gnawed at by complexes, I let myself get taken down', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tisíc kousků%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tisíc kousků%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'A Thousand Pieces' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Musíš odejít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'You Have to Leave' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'We''re Chilling', 'When we chill together, we look terribly wise
When we chill together, we sail through a sea of smoke
When we chill together, the atmosphere gets nice and thick
with every next piece that slides down our throat

When we chill together, we look terribly wise
When we chill together, we sail through a sea of smoke
When we chill together, the atmosphere gets nice and thick
with every next piece that slides down our throat

it''s a mighty wizard called weed, after it everything''s so B.I.G
we''re one team like G.I. JOE, so don''t stress us, it''s just a JOINT
please don''t be a stupid BOY, don''t stress, don''t stress, DON''T STRESS IT
we''re no threat, because we get it like few others do
we chill, we chill all the time, as long as there''s a roller dozing in our mouth
the end as thick as a thumb, we suck it like a proper mammal
we hold it in like a proper connoisseur, then hungry like a predator
I run to grab some grub and then we can WEED again

tokes, blunts, bongs, we''re fighting on every single front
papers in our pockets, filters for the bucket, joints, indica, sativa, indoor, outdoor
the grinder grinds the bud for us, we grind, grind, grind a gram
at home or outside, with the crew or alone, I pull on a fat one and then I sing

When we chill together, we look terribly wise
When we chill together, we sail through a sea of smoke
When we chill together, the atmosphere gets nice and thick
with every next piece that slides down our throat

When we chill together, we look terribly wise
When we chill together, we sail through a sea of smoke
When we chill together, the atmosphere gets nice and thick
with every next piece that slides down our throat

We never get enough of it, stop, you fool? we''ve got no reason to
you don''t know that state that''s so much, peace and love, no anger
we chill, we chill all the time, there''s always a roller dozing in our mouth
the end still like a thumb, we still suck it like a mammal
still holding it in like a connoisseur, we''ve got a whole bundle rolled
the appetite still won''t fade, so pass me another roller', 0
FROM `songs` s
WHERE s.`name` LIKE 'Chillujem%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Chillujem%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'We''re Chilling' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Fajn%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Fine' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'We Have to Live', 'Even when it hurts, we have to go on,
time heals the wounds, you know, we have to live.

Even if yesterday was shit,
today a new day is waiting for me,
whatever lies ahead of me,
I don''t believe that anything''s impossible.
I''m not always the positive type,
I''ve hit rock bottom now and then too,
but you won''t get rid of me that easily,
I''m something like Sauron.
Even when there''s no money, school is fucking awful,
sure, I''m at work all the time,
but I haven''t even come close to the big money,
so I''ll never give up in my life,
I''ll grind until
I become a star,
I''d love to fly in the sky,
but not belong to the air force.
Boom, this is exactly the sound of me going for it,
I''m really working on something,
while you''re writing it on Facebook,
I didn''t get anything from my dad,
I''d like to give it all back to my mum,
nothing falls into your lap by itself,
you have to be willing to go further, even for your goal.
My friend, I know very well what it means
to live in poverty, like caught in a net,
you feel like everything''s going to shit,
but that''s what the story is about,
don''t be spoiled like a child.

Even when it hurts, we have to go on (have to go on),
time heals the wounds, you know, we have to live (have to live).
Even when it hurts, we have to go on (have to go on),
time heals the wounds, you know, we have to live (have to live).

I''ve failed and lost so many times,
but I never asked why me,
I just got up and moved on,
I''d love to win every match
and celebrate like a Dane, but then I''d never
have the humility I have now.
Walking through hell is better
than having everything right under your nose
and living like a shallow comedian or a dickhead
who knows nothing about life,
laughter, it''s more like crying,
''cause without pain you''ll never know what happiness is.
And I''ve fallen flat on my face so many times
that I''d rather not count anymore,
and I think more about how much I''ll give
than about how much I should take,
I know it''s better to pass the ball
than to fuck it up and not win at all.
And so I keep standing with both feet firmly on the ground
and I''m working on it,
so that one day I''ll live every dream I''ve ever had,
the world is sometimes complicated,
I can''t figure it out myself either,
and I''ve got it the same as you,
none of you is alone in this.

Even when it hurts, we have to go on (have to go on),
time heals the wounds, you know, we have to live (have to live).
Even when it hurts, we have to go on (have to go on),
time heals the wounds, you know, we have to live (have to live).', 0
FROM `songs` s
WHERE s.`name` LIKE 'Refew - Musíme žít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Refew - Musíme žít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'We Have to Live' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'I Don''t Get It', 'I don''t get where this evil in us comes from
I don''t get why it keeps fighting inside us
I don''t get where this evil in us comes from
Where this evil in us comes from
Why it keeps fighting inside us

We love each other, it eats us both up to sit next to each other
We feed ourselves honey with the poison in it
And all those x years with the question whether this is the last time
We say goodbye, we''re always being tested
We keep trying to be meant for each other
To meet halfway and not say more
Than what''s absolutely necessary
But it doesn''t work like that, it doesn''t work like that
It doesn''t work like that, being together out of habit
It really doesn''t work, I reach for the door handle
I want to disappear, I call mayday, there''s a net around us
Sewn from memories and those places
We already know it''s not like it used to be
It only creaks now, but in other beds

And in the morning like nothing happened, in the morning like nothing
And in the morning like nothing happened, in the morning like nothing

False illusions, true lies
Over breakfast we talk about the days when we were a team
We lived with the idea that I was Caesar and she was my Rome
False illusions, true lies
Over breakfast we talk about the days when we were a team
We lived with the idea that I was Caesar and she was my Rome

And that''s why I don''t get where this evil in us comes from
I don''t get why it keeps fighting inside us
I don''t get where this evil in us comes from
Where this evil in us comes from
Why it keeps fighting inside us

But it wasn''t enough for us
And for a long time we haven''t found a reason to drag it on
We still have old memories
That bond of a few years is what ties us together now
We''ve got another notch, you''re looking for new faces
You''re starting to shine again, the first time I''m not getting jealous
So get lost, pack up all your stuff
I made peace long ago with being alone on the track
You gave me the idea yourself, we''ve got liars on both sides
we know the plan well, there''s no interest in saving that old relationship
That was so beautiful, when did it turn so empty
Those days that won''t come back, you''re a burden to me
So don''t hesitate anymore, you can go now..

We''ll both be better off
 and you can go now..
We''ll both be better off
 and you can go now..
We''ll both be better off', 0
FROM `songs` s
WHERE s.`name` LIKE 'Nechápu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Nechápu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'I Don''t Get It' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Go', 'I see those childhood dreams, I hear those voices that said "go",
they gave me readings about how to prepare to bear those days,
and so I went, a story made in hell, I slaved away for that dream.
Through the sewers, and the years kept flowing, I tell myself a hundred times, I can''t let it happen again, I can''t let it happen again,
walk in my own footsteps and achieve anything, upright like poplars,
young or leaning on a cane,
each of us knows our own values, each of us is a prototype,
that''s why I want to ask for a little humility.
Each of us has our unfulfilled dreams,
we dream about them at night, we chase them all day long,
every face knows the tears running down it,
when bad luck and chance shake hands again.

I see those childhood dreams, I hear those voices that say "go".
I see those childhood dreams, I hear those voices that say "go".', 0
FROM `songs` s
WHERE s.`name` LIKE '%Jdi%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Jdi%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Go' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Dear Baby Jesus', 'Dear Baby Jesus, what beauty are you bringing me,
Dear Baby Jesus, put it right there in a little bag,
Dear Baby Jesus, that''ll get me properly wasted,
Dear Baby Jesus, bring me a twelve-pack of beer with it.

The twenty-fourth of December, there''s nothing better than being lit,
I don''t know where to go, I don''t know what''s coming, so I just puff weed, try a little drinking,
so I can get to know the Christmas magic better,
the carp stares at me from the bathtub, I tell him "peace",
with one blow to the back of the head I''ll explain it all to him,
unfortunately I miss six times before that.
The carols around the radio got going, a good time to get wasted again,
roll around on the floor, shots, come to me,
I boost the Christmas mood with smoking, I appreciate the neighbours, they brought me mistletoe,
thank you, goodbye, merry and happy,
I''m all excited, the mistletoe flies into the trash and I fly on that weed.

Dear Baby Jesus, what beauty are you bringing me,
Dear Baby Jesus, put it right there in a little bag,
Dear Baby Jesus, that''ll get me properly wasted,
Dear Baby Jesus, bring me a twelve-pack of beer with it.

Baby Jesus took a shit under my tree, wrote on a note that I''m supposedly a bastard,
that I smoke weed and booze, party and fuck, laze around at home and jerk off.
I go blah blah, let him babble, I''m a fool, haha, long live the grass,
it doesn''t happen to many people that Baby Jesus scolds them, I can''t handle it mentally,
so I hit the bottle, lava''s pouring from my eyes, I go for the Christmas cookies,
they''re so full of rum that I remember nothing at all, zero chance
of keeping it all in my guts, I''m throwing up a metre long.
The next morning I''m picking myself up off the floor, little legs, carry me straight to bed,
it''s not happening today, leave me alone today,
last night Baby Jesus was really mean to me.

Dear Baby Jesus, what beauty are you bringing me,
Dear Baby Jesus, put it right there in a little bag,
Dear Baby Jesus, that''ll get me properly wasted,
Dear Baby Jesus, bring me a twelve-pack of beer with it.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ježíšku panáčku%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Ježíšku panáčku%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Dear Baby Jesus' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'I Already Know', 'I wish I could fly, just like a bird flies,
just flap my wings, wave bye-bye,
shit on all of it from up high, not take anything to heart anymore
and with the hope I have left, head somewhere further,

I wish I could fly, just like a bird flies,
just flap my wings, wave bye-bye,
shit on all of it from up high, not take anything to heart anymore
and with the hope I have left, head somewhere further,

somewhere
where there''s no pride, no stupid lies,
and people don''t just know gimme gimme.
My nerves have to be tougher than a tank''s steel,
I look at it from above, as if I stood
on top of Mont Blanc.
Yin and yang stopped working long ago,
everything good I do always turns bad,
fate pays me back for everything, I pay for it nonstop,
but the time will come when I turn that card over.

I already know, what happened was meant to happen,
it''s all fate, there''s no point fighting it, fuck.
I already know, sometimes it''s harder than it seems,
the things fate sometimes has in store for you are really disgusting.

Life kicks my ass, really at full blast,
I''ve visited every corner of my life, I think,
I''ve cleaned up every piece of shit anyone left for me here,
whatever I touched, I always screwed up.

Dreams turned to dust, only fear is left in my eyes,
what happens next, I''m waiting for the next crash to come,
what will go wrong again, who will stab me in the back again,
there are people among us who''d drive a knife into my back.

I already know, what happened was meant to happen,
it''s all fate, there''s no point fighting it, fuck.
I already know, sometimes it''s harder than it seems,
the things fate sometimes has in store for you are really disgusting.

Betrayal, pain,
a bad ending,
city or village,
nothing but idiots, egoists,
they want to see me burn,
they want to see me down,
so lick it up, dude.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Já už vím'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Já už vím' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'I Already Know' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Way at the Back', 'You can beg, you can kneel, you can keep on crying,
nobody cares, you''re on your own with everything.
All your problems flash before your eyes in an instant,
but everyone walks their own thorny path.
(4×)

You''re drowning in debt, no improvement in sight,
twelve hours straight at work, poor citizens,
no time for their kids, they have to work, sleep, get up in the morning,
take overtime again and again just to scrape by.
You''ve been through so much that nothing surprises you anymore,
an unexpected notice of dismissal at work,
work drives you to admit you''re shitting yourself when you find out about the welfare wage,
that you''re supposed to pay your bills with.
All that''s left is tears, there''s not even small change left,
just another beggar left who didn''t get far,
and still, every next morning an obedient sheep joins the herd,
some for grub, some for meth,
they''ll even let the skin be stripped off them.
A pile of phases, how dreams fade, somewhere far away the trees of wishes keep being cut down,
even when you fight back, even when you think you''re catching up,
a twist can come, and how do you get up then, feeling there''s nothing worth standing for.
It was OK, now on pills in a white gown, way at the back,
slowly getting weaker, slowly reaching for what seems right at that moment,
drugs and booze for stolen stuff, family pushed aside, he''s frightening,
he''s not that guy anymore, he''s sadly given up,
it was really too much, they found him on a tree last night,
on paper he wrote his last essay, and at the end, that he did what he could.

You can beg, you can kneel, you can keep on crying,
nobody cares, you''re on your own with everything.
All your problems flash before your eyes in an instant,
but everyone walks their own thorny path.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%vzadu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%vzadu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Way at the Back' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', NULL, 'Solo, I want to be solo with you,
you and me, just the two of us, all night and only darkness around us.
Solo, I want to be solo with you.

We vanish, lust in our eyes, don''t expect anything cheesy, I''m a top grafter, you''re top, you know,
I want to undress you, I want to have you, take you home with me.
It''s crazy how you''re more and more, we''re closer and closer, I''m aiming lower and lower, rising higher and higher,
a showpiece girl, tattoos everywhere, piercings, jewellery, not like those nags, totally sexy,
only now I don''t want to, I want to teach you a lesson for your life,
do it better, do it longer than the ones who did it before,
one look and I know what to do with that perfect body,
addictive like meth, I can feel endorphins in the air.

Solo, I want to be solo with you,
you and me, just the two of us, all night and only darkness around us.
Solo, I want to be solo with you, we''re on round two with grace like Zorro,
twisted, and I almost roar "toro" at you, that''s the girl, obedient to every word,
she does it for her own good, squeals like a flute, plays with my cobra, let me between your thighs,
I want to play with your pussy, and for a long time, show her what''s what, I want sex, that''s my motto,
ever since things got to the point where I realised the good in me has died,
send your speech by post.

Now you''re solo, I want to be solo with you,
you and me, just the two of us, all night and only darkness around us.
Solo, I want to be solo with you,
you and me, just the two of us, all night and only darkness around us.

Solo, I want to be solo with you, water polo in the bathtub,
a flood, but so what, I can''t help it, I''m in the mood for a deep dive,
a Medal of Honor battle, a doctor with a degree,
I know your weak spots: ears, belly, groin,
don''t stop moving, I love watching it,
I''m a lost cause, the bed has to creak,
feathers will fly, the champagne has to spray,
she can''t help it, she has to bite, scratch, moan,
I can''t stop, just imagine those moves of hers,
porn star number one who wants to be punished, one in a hundred,
señora of my dreams, Lexus class, so don''t disturb us, I''m taking a holiday and this woman.

Now you''re solo, I want to be solo with you,
you and me, just the two of us, all night, but both of us still single.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Solo%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', NULL, 'It started innocently, one time like this after some wine,
we sit, we hang around, we know nothing about the world,
barely fifteen years old, well, clueless boys,
they roll their first green cigarette,
a swaying feeling kicks in when you light up that blunt,
with an appetite for life I throw myself into the whirl of discovery,
I don''t even have spit in my mouth, I dissolve in this smoke,
well, this plant, every hour since then.
Food and drink taste better, work is easier to survive,
the whole day is cheerful, so don''t act shy,
sit down in the circle, don''t be a fool, you only have one life, so enjoy it properly.

It''s ganja, a mighty wizard called ganja,
a saviour and a cure for sadness and anger,
few people understand it, people aren''t willing to live free lives.
(2×)

Right in the morning, as soon as I get up, I roll half a gram,
I leave the other half gram on the schedule for later,
bans everywhere, plants are illegal, but that won''t stop me
from searching for the ideal spots to crawl into and let myself be seduced by grandiose buds,
now all that''s left is to roll up, flop down on my back,
enjoy perfect highs without work, without effort.
Yeah, that''s what I like, that''s what I enjoy, shout-out to all my friends who do the same,
we''re enchanted by a mighty, peaceful spell,
there''s no comparing it to booze.

It''s ganja, a mighty wizard called ganja,
a saviour and a cure for sadness and anger,
few people understand it, people aren''t willing to live free lives.
(3×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ganja%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Damn, Dude', 'Damn, dude, damn, dude,
so get it, I''m going a hundred percent,
year after year I fuck everything, I fuck you, I fuck everything these days,
sorry that I''m like this, arrogant, high on poppy,
they can''t understand that I fuck Czech laws.
Czech politics a.k.a. fat fanatics,
the fucked-up point of this whole world,
I don''t want to have anything to do with it anymore, I see the traffic lights blinking,
so we keep going, there''s nothing to wait for, bro.
I ride in formation like kryptonite, I explode like dynamite,
you feel like a superhero, you want to stop us, bro,
you''re our source of food, a shitty wannabe,
the hater still has no idea his career level is ending,
your spheres, your half-played sides, about the purity of race,
your routes, religious salvation,
fucked-up talk to me, I go a hundred percent to the point.

You can''t go on, homie, without it you''re really not high,
you don''t know which way to go yourself, tactics, your own plan.
(2×)

The Czech Republic, just right for an alcoholic,
the fact that we live here isn''t exactly great luck,
scams, bribes, that''s our government''s game,
raise all the prices fast, where the fuck are we supposed to get the money.
First in booze, first in drugs, everybody''s rolling a joint,
it''s rotten here, that''s the whole point,
I''m used to it, and I don''t care about it anymore,
be sure, man, that I''ll take care of quality rap,
rap is my life and life is short,
sometimes up, sometimes down, well, it''s a bit fickle,
this is my style, so you can be sure of that,
and I really don''t care, man, what you think of me,
I simply have my path, a chosen path,
even though it''s clear to me that many won''t get it,
I give it the way I give it, I live where I live,
I can''t do anything about it, yeah, I take it as it is.

You can''t go on, homie, without it you''re really not high,
you don''t know which way to go yourself, tactics, your own plan.
(2×)

Damn, dude, look how life is down below,
at least for a while put yourself in my shoes,
my balls are sweating from how hard I have to grind,
and it makes me sick to know how little I''ll get for it.
You sit on your ears in your ties, dressed up, perfumed, wallets overflowing,
it''s pushing you up the ass and it''s still not enough for you,
I''m not blind, stupid, or the youngest either,
but I have my plan that''ll save me,
our CD will be easy to get everywhere.
We''ll show you things you''ve never known till today,
I don''t care that I do things that aren''t legal,
the forbidden fruit is easy to get everywhere here,
and that''s why the cops love to race through my village,
they probably don''t find it completely normal
that I don''t pay taxes on what I do.

Plans and tactics supposedly mean nothing to me,
I''m surprised when I hear people blaming me for it,
yesterday I was doing what I''m doing today,
from morning till evening I hung around at Tesco,
I always have to booze, I don''t want to stop anyway,
I live and profit only from the city''s handouts,
many times I had to sleep on the pavement,
I''m a welfare bum, I reek of decay,
me and my gang take up our positions,
day after day we want money from everybody around,
I sit down on the ground with a hungry mutt,
you see a paw with a hat, you walk around me in a wide arc,
I''m asking for it, I''ve got a black eye,
I don''t move from the spot, I''m where I was a year ago,
I''m a lazy scumbag, that label won''t wash off,
my plan is to dig concrete with my face all my life.

You can''t go on, homie, without it you''re really not high,
you don''t know which way to go yourself, tactics, your own plan.', 0
FROM `songs` s
WHERE s.`name` LIKE 'JML - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'JML - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Damn, Dude' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Strange Planet', 'A strange feeling takes over you when you open your eyes,
we''ve got our fingers in it, don''t try to clear yourselves of guilt,
let''s behave the way guests should behave,
we''ll beg too late, when only ruins are left here.
(2×)

I''m shuffling along alone down a dark and long road,
walking with my head bowed, clouded, confused,
full of thoughts that just won''t go away,
only people leave, they take beautiful memories with them,
and they take a price with them that''s unbearable for me,
it''s fake like a henna tattoo,
they''re here for a while and then they laugh,
well, on a strange planet strange things happen.
I''m heading into bad weather, where everyone looks at beauty,
girls measure a relationship by the length of the dicks,
where did the drive go, every gentleman used to have it,
a gentleman on every corner opened doors for ladies, and today,
wherever I look, someone kidnapped someone,
it''s horror, madness, forests cut down everywhere,
on our planet only industry can bloom,
and this planet is like a cage you can''t escape from,
wars, racism, drugs, murderers,
so many traps that knock people to their knees,
a ricocheting bullet that killed a little boy,
for the family it''s unimaginable torment,
alcohol behind the wheel, drugs in the streets,
a mess next to the road, where is this world heading,
my mind is starting to stop at what''s going on,
''cause I''m standing with you on a ship that''ll soon be wrecked.

And what is this? And where am I?
Is this reality, or just a stupid dream?
Am I some kind of idiot, or do you have that feeling too,
that our land is rushing to its doom right under our noses?

Step by step you walk through life,
you fight for your place under the sun,
you don''t want to be a slave, you worry about the future,
but you can hardly know what will happen around the corner,
look, your plans can die quickly,
in a moment everything''s different, you won''t even have time to move,
this strange planet sweeps destinies around,
death comes like a bastard and slits your throat.
Mankind doesn''t learn, hostility rules the world,
little kids press their fingers on the trigger of a machine gun,
we''ve been seeing it here for an eternity,
we close our eyes, we sit whole hours away on the net,
we work, we contribute to the boom,
we fucking kill most of our time,
you look forward to the date when you collect your paycheck,
you''re surprised, robot, that you didn''t fill your pockets.
People are always in a hurry, even though they don''t know where,
life is slowly but surely losing its meaning,
life and quality are measured in money today,
nobody believes anymore that truth and love will win,
there''s no room for feelings, we''re building careers,
we devastate the land, we put up barriers,
we recklessly pump shit into the atmosphere,
what will our sons and daughters breathe, I wonder.
I''m not trying to play the Salvation Army,
it just pisses me off how people saw off the branch they''re sitting on,
ignoring the facts and the problem doesn''t pay off,
not even the saints will help, everything will come back to us.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Divná planeta%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Divná planeta%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Strange Planet' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'Damn, Dude', 'Damn, dude, look how life is down below,
at least for a while put yourself in my shoes,
my balls are sweating from how hard I have to grind,
and it makes me sick to know how little I''ll get for it.
You sit on your ears in your ties, dressed up, perfumed, wallets overflowing,
it''s pushing you up the ass and it''s still not enough for you,
I''m not blind, stupid, or the youngest either,
but I have my plan that''ll save me,
our CD will be easy to get everywhere.
We''ll show you things you''ve never known till today,
I don''t care that I do things that aren''t legal,
the forbidden fruit is easy to get everywhere here,
and that''s why the cops love to race through my village,
they probably don''t find it completely normal
that I don''t pay taxes on what I do.

Plans and tactics supposedly mean nothing to me,
I''m surprised when I hear people blaming me for it,
yesterday I was doing what I''m doing today,
from morning till evening I hung around at Tesco,
I always have to booze, I don''t want to stop anyway,
I live and profit only from the city''s handouts,
many times I had to sleep on the pavement,
I''m a welfare bum, I reek of decay,
me and my gang take up our positions,
day after day we want money from everybody around,
I sit down on the ground with a hungry mutt,
you see a paw with a hat, you walk around me in a wide arc,
I''m asking for it, I''ve got a black eye,
I don''t move from the spot, I''m where I was a year ago,
I''m a lazy scumbag, that label won''t wash off,
my plan is to dig concrete with my face all my life.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Skeli a Babar - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Skeli a Babar - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Damn, Dude' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'en', 'An Ordinary Man', 'They say I should smile, follow the herd,
crawl up people''s asses, probably even wipe them,
they say I should tone it down and stop pushing it so hard,
and come to terms with how things are, shuffle my feet, keep my head down.
Don''t deal with this, you won''t change that, there''s nothing you can do,
don''t think, switch off your brain, work till your body tears apart,
better keep your opinion to yourself,
you''re not here to change the course of bad things.

You''re an ordinary man, your lot is to wallow in shit,
paying off the bill all your life, letting yourself be dragged along,
your train left the moment you first saw the world,
so shut your mouth, fall in step and get back in line.
(2×)

I''m a little bastard, almost five feet tall,
I stick my head out of the crowd, they want to impale me on a stake,
I took hard blows, they pour salt into them,
I''ll take countless more blows,
they fly from all sides, and I don''t do things just because they''d be cool,
I don''t have the same hobbies as every other fool,
I keep paying for my nature, as I deserve,
it''s a bummer that I successfully stand out from the average,
nobody can be below average or above average,
keep your dreams to yourself, you''d better fucking take them,
you just have to work, sleep, work, sleep, work, sleep,
earn shit, shit straight down the toilet, thanks, I''m not interested
in walking with the herd, I''m really not crazy, I follow my own plan,
better keep your opinion to yourself,
I''ll go my own way as long as I have breath.

You''re an ordinary man, your lot is to wallow in shit,
paying off the bill all your life, letting yourself be dragged along,
your train left the moment you first saw the world,
so shut your mouth, fall in step and get back in line.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Obyčejnej člověk%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'en')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Obyčejnej člověk%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'An Ordinary Man' WHERE l.`lang` = 'en' AND (l.`title` IS NULL OR l.`title` = '');

-- de
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', NULL, 'Ich will einen Edelstein, ich will keine Pamela-Hoe,
aber wenn sie will, kann ich dir Rauch geben,
sie baut mir gern eine Pyramide, ich steck ihn rein, dann fahr ich weg,
mein Bruder kommt, übernimmt den Staffelstab, tu nicht so, als wärst du nie drauf gewesen,
ich glaub dir kein Wort, es regnet dir wieder in die Schuhe, mehr als ein Schwanz im Maul,
damit machst du deine Promo, spiel bei mir nicht die Unschuldige,
RDM oder Zoom, dann schicken wir dich zu den nächsten Hunden, dann schicken wir dich zu den nächsten Hunden,
RDM oder Zoom, dann schicken wir dich zu den nächsten Hunden.

Sie nahm ihn in den Mund, hier und da drüben,
in die Hundehütte bellen, es zieht dich auf den Grund,
ihre einzigen Friends nur auf OnlyFans,
sie hat keine Hemmungen, gibt sich allen hin.

Handtaschen, Schühchen und ein neuer Schlitten,
einen runterholen, einen blasen, das Geld ist verdient,
das älteste Gewerbe ernährt dich jetzt,
deine Fotos haben das Netz überflutet.

Der Körper ist im Umlauf, der Kopf ist offline,
sie ziehen die Hände weg, sobald sie dich kennenlernen,
null Werte, du bist keine Dame,
was sagt deine Mama zu deiner Muschi?

Schick ihr Grüße, wink mit dem Dildo,
dir ist der Charakter ausgegangen, du löst es mit einem Pils,
jeder nimmt sich von dir nur ein Stück,
die Datenbanken löschen sich nicht von selbst.

Ist dir egal, Hauptsache, du verdienst die Kohle,
easy money für deinen Körper, Würde tschüss.
Ist dir egal, Hauptsache, du verdienst die Kohle,
easy money für deinen Körper, Würde tschüss.

Die Schlampe denkt, sie kann mich reinlegen, aber das wird ihr nicht gelingen,
sie wollte, dass ich auf ihr komme, aber ich sag ihr: Kleine, nein, nein, nein, nein,
mit so einer wär ich nicht zusammen, ich bin nicht verrückt, ich würde mich nie selbst verraten.
Mich würde interessieren, wo euer Wert geblieben ist,
der ist verschwunden, als ihr für Geld Schwänzen hinterhergejagt seid,
das Wort „Frau“ sagt euch also nichts,
und dass sie sich gut anzieht, bedeutet gar nichts.

Zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
let''s go, zoom, zoom,
spielt das auf der Show und lasst es alle hören, lasst die Boxen knallen,
dieser Track ist nicht sweet, ist kein Candy, wirklich kein Candy,
Mädel, halt die Klappe, du hast nichts zu sagen, jetzt reden die Teufel,
die andere soll beiseitegehen und bis zum Abend auf mich warten,
das Mädel verteilt Weed, denkt, keiner weiß es, denkt, sie kann es verheimlichen,
ihr Umfeld hat es mir erzählt, sie wird es jedem geben, sie wird eine blöde Kuh,
aber eines Tages verbrennt sie die Lava, und ich tanze Tango und Walzer.

Sie ist eine blöde Kuh und macht gern Drama,
Dämonen, Hast, sie reitet auf der Welle, sie drehen den Rücken zu,
am Alkohol zerbricht sie, sie nimmt sich jeden,
und die Selbstachtung ist weg, sie ist nicht mehr so lieb.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Zoom - Drama%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Tick Tack', 'Vielleicht habt ihr es schon vergessen, aber ich bin immer noch da,
wir kämpfen mit dem Leben, bahnen uns den Weg.
Ich kehre vor meiner eigenen Tür, ich dränge mich nicht vor,
ich schaue aus der Ferne zu, wie die Kids sich Lines ziehen.

Seit fünfzehn zugedröhnt, das Leben ist wohl der Hammer,
sie ziehen es sich in den Rüssel, schließen sich im Käfig ein.
Tick tack, tick tack — der große Fuck kommt näher,
mit der Erkenntnis, dass vom Hirn nur noch Brei übrig ist.
Du schaust über die Schulter, die Paranoia hat dich im Griff.

Du hältst Ausschau nach den Bullen, was, wenn sie kämen,
sie würden dir das Kratom nehmen, das Crystal auch.
Sie würden all die Tütchen ausleeren,
du willst schnell verschwinden wie Fittipaldi.
All deine Haufen — was ist Realität?
Dein Life, eine große Katastrophe, Mortal Kombat, Fatality.
Sie führen dich zu ihrem Octavia, an den Händen spürst du die Handschellen,
über dir siehst du keinen Himmel, unter dir ist Lava.
Ich hab''s gesehen, als ich vom Angeln kam,
du spürst deine Angst, ein wahnsinniger Trip,
der Absturz kommt, du schmeckst die Scheiße.

Du willst mit jedem Stress, schuld ist dieser leere Griff,
du weißt nicht, wann du Stopp sagen sollst, du lernst nicht aus deinen Fehlern.
Du kannst anfangen, dein Grab zu schaufeln, dann bleibt keine Kraft mehr,
hoffentlich ist es kein Schock für dich, dass du den Lauf der Dinge nicht umkehrst.

Es zermahlt dich von selbst, zermahlt, zermahlt, zermahlt von selbst,
es nimmt dir die Ladung, nimmt, nimmt die Ladung.
Es frisst deine Seele auf, es frisst dein Gesicht auf,
was du säst, das erntest du,
deine Fresse sieht aus wie ein Herbarium,
du zerfällst wie eine Sphinx.

Du willst mit jedem Stress,
schuld ist dieser leere Griff,
du weißt nicht, wann du Stopp sagen sollst,
du lernst nicht aus deinen Fehlern.
Du kannst anfangen, dein Grab zu schaufeln,
dann bleibt keine Kraft mehr,
hoffentlich ist es kein Schock für dich,
dass du den Lauf der Dinge nicht umkehrst.

Tick tack, tick tack, dir läuft die Zeit davon,
tick tack, tick tack, du bist ein hoffnungsloser Fall,
tick tack, tick tack, endlose Paranoia.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tik Tak%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tik Tak%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tick Tack' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Tausend Stücke', 'fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen

fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen
ich suche mich selbst und weiß nicht, wo ich anfangen soll
mir fehlt ein Stück des Organs, das mich nach vorne treiben soll
ich weiß nicht, was von mir übrig ist, ob ich das noch bin
ein Körper ohne Seele und eine Seele ohne Körper
sie haben mich in tausend Stücke gerissen und sind dann weitergezogen

sind weitergezogen

fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen

fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen

und jetzt suche ich die Spuren, auf denen ich schon einmal ging
ich weiß nicht, was passiert ist, dass ich das alles vergessen hab
ich hab den Kompass weggeworfen, der mir die richtige Richtung zeigte
ich hab mich von der Strömung treiben lassen wie ein Boot ohne Ruder
und die Zeit vergeht und ich weiß, verschwendete Zeit hole ich nie zurück
die Türen, die ich geöffnet habe, sind schon fast zu
vielleicht hab ich noch eine Chance, vielleicht ist es nicht verloren

fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen

fröhliche Tracks kommen mir gerade wirklich nicht gut von der Hand
von Komplexen zerfressen, hab ich mich erledigen lassen', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tisíc kousků%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tisíc kousků%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tausend Stücke' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Musíš odejít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Du musst gehen' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Wir chillen', 'Wenn wir zusammen chillen, schauen wir furchtbar weise
Wenn wir zusammen chillen, segeln wir durch ein Meer aus Rauch
Wenn wir zusammen chillen, wird die Stimmung schön dicht
mit jedem weiteren Stück, das uns in den Hals rutscht

Wenn wir zusammen chillen, schauen wir furchtbar weise
Wenn wir zusammen chillen, segeln wir durch ein Meer aus Rauch
Wenn wir zusammen chillen, wird die Stimmung schön dicht
mit jedem weiteren Stück, das uns in den Hals rutscht

es ist ein mächtiger Zauberer namens Weed, danach ist alles so B.I.G
wir sind ein Team wie G.I. JOE, also stress uns nicht, ist nur ein JOINT
sei bitte kein dummer BOY, stress nicht, stress nicht, STRESS DAS NICHT
wir sind keine Gefahr, denn wir verstehen es wie kaum einer
wir chillen, wir chillen ständig, solange eine Tüte im Mund döst
das Ende dick wie ein Daumen, wir ziehen dran wie ein echtes Säugetier
wir halten''s drin wie ein echter Kenner, dann hungrig wie ein Raubtier
ich renn los, was zu futtern holen, und dann können wir wieder WEED

Züge, Blunts, Bongs, wir kämpfen an allen Fronten
Papers in den Taschen, Filter für den Eimer, Joints, Indica, Sativa, indoor, outdoor
der Grinder mahlt uns die Buds, wir mahlen, mahlen, mahlen ein Gramm
zu Hause oder draußen, mit der Crew oder allein, ich zieh an einer dicken und dann sing ich

Wenn wir zusammen chillen, schauen wir furchtbar weise
Wenn wir zusammen chillen, segeln wir durch ein Meer aus Rauch
Wenn wir zusammen chillen, wird die Stimmung schön dicht
mit jedem weiteren Stück, das uns in den Hals rutscht

Wenn wir zusammen chillen, schauen wir furchtbar weise
Wenn wir zusammen chillen, segeln wir durch ein Meer aus Rauch
Wenn wir zusammen chillen, wird die Stimmung schön dicht
mit jedem weiteren Stück, das uns in den Hals rutscht

Wir kriegen nie genug davon, aufhören, du Narr? wir haben keinen Grund
du kennst den Zustand nicht, der so viel ist, Frieden und Liebe, keine Wut
wir chillen, wir chillen ständig, immer döst eine Tüte im Mund
das Ende immer wie ein Daumen, wir ziehen immer dran wie ein Säugetier
halten''s immer drin wie ein Kenner, wir haben ein ganzes Bündel gedreht
der Appetit lässt immer noch nicht nach, also gib mir die nächste Tüte', 0
FROM `songs` s
WHERE s.`name` LIKE 'Chillujem%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Chillujem%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Wir chillen' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Prima', 'Und die Karten sind längst verteilt
wir strecken die Hände nach den Dingen aus, die uns aufbauen
auch wenn wir unwissentlich so etwas wie Untertanen sind
bringen wir Leistungen, die sie für uns verkaufen

mit dem Gedanken an jeden nächsten besseren Tag
früh am Morgen aufstehen, also los, Schafe, wir gehen
uns durch den täglichen Ablauf beißen
für Almosen ziehen wir uns die Haut ab
sollen sie''s prima haben, sollen sie''s prima haben, sollen sie''s prima haben

von der Spitze der Pyramide muss die Welt prima aussehen
aber was ist mit dem Rest, der in ihrem Schatten stehen muss
hast du sie gefragt, ob sie es prima haben,
ob sie es prima haben, ob sie es prima haben

gestern kam er im BMW, morgen holt er sich eine Klasse höher, weißt du
vor meinem Haus steht eine Karre, die schon anfängt zu rosten
die Rechnungen stapeln sich, sie haben am Lohnzettel gedreht
ein bisschen was in den Kühlschrank, mein Geldbeutel ist leer

Und die Karten sind längst verteilt
wir strecken die Hände nach den Dingen aus, die uns aufbauen
auch wenn wir unwissentlich so etwas wie Untertanen sind
bringen wir Leistungen, die sie für uns verkaufen

ich sage, genug !!!

ich nehme es selbst in die Hand und gehe meinen Weg
ich hab keine Lust mehr, für fremde Träume zu arbeiten
für deinen verfickten Urlaub

also mach''s gut, ich fang den Vibe und mach einen Strike
der Padawan will den Hype hören
der Padawan will den nächsten Like
der Padawan wird zum Meister und die Armut verschwindet für immer
nur noch saubere Hände, mit dem Installateur verpisst euch irgendwohin
ich will mehr bekommen, als nur dreckige Rohre in diese Wände zu stopfen
ich will mehr bekommen, als nur dreckige Rohre in diese Wände zu stopfen', 0
FROM `songs` s
WHERE s.`name` LIKE 'Fajn%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Fajn%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Prima' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', NULL, 'Ich bin noch nicht mal auf die Szene geflogen, schon wünschen sie, dass ich verrecke,
dass ich''s ausdrücke, dass ich stolpere, ich sei angeblich ein Wichser, der nur Scheiße kann,
nicht mal Scheiße, Schluss mit Kitsch, in diese Beats lehn ich mich rein wie der Wind,
erwarte keinen Hundehaufen, ich bring einen Hit plus, such dir eine neue Muschi,
nach diesem Shit will sie auf meinem Dick sein.

Also gewöhn dich dran, ich starte das Business, ich hab den Hebel, mein Leben zu ändern,
es weitergeben, höher kommen, ein ehrlicher Malocher,
eine Million verdienen und es besser haben, Top-Seed säen, Top-Weed rauchen,
anfangen, das Leben zu leben, aufhören dahinzuvegetieren, unter dem Kessel nachlegen,
sich nicht um Wichser kümmern, aaah...

Unter dem Kessel nachlegen, sich nicht um Wichser kümmern, aaah...
Unter dem Kessel nachlegen, sich nicht um Wichser kümmern, aaah...
Unter dem Kessel nachlegen, sich nicht um Wichser kümmern, aaah...

So viel Heat, so viele Hater!
So viele Hater!', 0
FROM `songs` s
WHERE s.`name` LIKE 'Machine gun%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Wir müssen leben', 'Auch wenn es wehtut, wir müssen weitergehen,
die Zeit heilt Wunden, weißt du, wir müssen leben.

Auch wenn gestern scheiße war,
heute wartet ein neuer Tag auf mich,
was auch immer vor mir liegt,
ich glaube nicht, dass etwas unmöglich ist.
Ich bin nicht immer der positive Typ,
auch ich bin ab und zu am Boden gewesen,
aber so leicht werdet ihr mich nicht los,
ich bin so etwas wie Sauron.
Auch wenn kein Geld da ist, die Schule ist echt beschissen,
klar, ich bin ständig auf der Arbeit,
aber an das große Geld bin ich nicht mal rangekommen,
also gebe ich im Leben nicht auf,
ich werde schuften, bis
aus mir ein Star wird,
ich würde gern am Himmel fliegen,
aber nicht zur Luftwaffe gehören.
Boom, das ist genau der Sound, wie ich dafür gehe,
ich arbeite wirklich an etwas,
während du es auf Facebook schreibst,
ich hab von meinem Vater nichts bekommen,
meiner Mama würde ich gern alles zurückgeben,
nichts fällt dir von selbst in den Schoß,
du musst bereit sein, weiterzugehen, auch für dein Ziel.
Mein Freund, ich weiß sehr gut, was es heißt,
in Armut zu leben, wie in einem Netz gefangen,
du hast das Gefühl, alles geht den Bach runter,
aber genau darum geht die Geschichte,
sei nicht verwöhnt wie ein Kind.

Auch wenn es wehtut, wir müssen weitergehen (müssen gehen),
die Zeit heilt Wunden, weißt du, wir müssen leben (müssen leben).
Auch wenn es wehtut, wir müssen weitergehen (müssen gehen),
die Zeit heilt Wunden, weißt du, wir müssen leben (müssen leben).

Ich hab schon so oft versagt und verloren,
aber ich hab nie gefragt, warum ich,
ich bin einfach aufgestanden und weitergegangen,
ich würde so gern jedes Spiel gewinnen
und feiern wie ein Däne, aber dann hätte ich nie
die Demut, die ich jetzt habe.
Durch die Hölle zu gehen ist besser,
als alles direkt vor der Nase zu haben
und nur wie ein oberflächlicher Komiker oder ein Arschloch zu leben,
der nichts vom Leben weiß,
Lachen, das ist eher zum Weinen,
denn ohne Schmerz weißt du nicht, was Glück ist.
Und ich bin so oft auf die Fresse geflogen,
dass ich es lieber nicht mehr zähle,
und ich denke eher daran, wie viel ich gebe,
als daran, wie viel ich nehmen sollte,
ich weiß, es ist besser, den Ball abzuspielen,
als es zu verkacken und gar nicht zu gewinnen.
Und so stehe ich weiter mit beiden Beinen fest auf dem Boden
und arbeite daran,
dass ich eines Tages jeden Traum erlebe, den ich je hatte,
die Welt ist manchmal kompliziert,
ich finde mich darin selbst nicht zurecht,
und mir geht es genauso wie euch,
keiner von euch ist damit allein.

Auch wenn es wehtut, wir müssen weitergehen (müssen gehen),
die Zeit heilt Wunden, weißt du, wir müssen leben (müssen leben).
Auch wenn es wehtut, wir müssen weitergehen (müssen gehen),
die Zeit heilt Wunden, weißt du, wir müssen leben (müssen leben).', 0
FROM `songs` s
WHERE s.`name` LIKE 'Refew - Musíme žít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Refew - Musíme žít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Wir müssen leben' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Ich versteh''s nicht', 'Ich versteh nicht, woher dieses Böse in uns kommt
Ich versteh nicht, warum es in uns immer kämpft
Ich versteh nicht, woher dieses Böse in uns kommt
Woher dieses Böse in uns kommt
Warum es in uns immer kämpft

Wir lieben uns, es frisst uns beide auf, nebeneinander zu sitzen
Wir füttern uns mit Honig und darin das Gift
Und diese x Jahre mit der Frage, ob es das letzte Mal ist
Dass wir uns verabschieden, wir werden immer geprüft
Wir versuchen immer, füreinander bestimmt zu sein
Uns entgegenzukommen und nicht mehr zu sagen
Als das, was unbedingt nötig ist
Aber so geht das nicht, aber so geht das nicht
Aber so geht das nicht, aus Gewohnheit zusammen zu sein
Es geht wirklich nicht, ich greife nach der Klinke
Ich will verschwinden, ich rufe Mayday, um uns ein Netz
Genäht aus Erinnerungen und diesen Orten
Wir wissen schon, dass es nicht mehr wie früher ist
Es quietscht nur noch, aber in anderen Betten

Und am Morgen, als wäre nichts, am Morgen, als wäre nichts
Und am Morgen, als wäre nichts, am Morgen, als wäre nichts

Falsche Illusionen, wahre Lügen
Beim Frühstück reden wir über die Tage, als wir ein Team waren
Wir lebten damit, dass ich Cäsar war und sie mein Rom
Falsche Illusionen, wahre Lügen
Beim Frühstück reden wir über die Tage, als wir ein Team waren
Wir lebten damit, dass ich Cäsar war und sie mein Rom

Und deshalb versteh ich nicht, woher dieses Böse in uns kommt
Ich versteh nicht, warum es in uns immer kämpft
Ich versteh nicht, woher dieses Böse in uns kommt
Woher dieses Böse in uns kommt
Warum es in uns immer kämpft

Aber es war uns zu wenig
Und schon lange finden wir keinen Grund mehr, es weiterzuziehen
Wir haben noch alte Erinnerungen
Dieses Band aus ein paar Jahren ist das, was uns jetzt aneinander bindet
Wir haben noch eine Kerbe, du suchst neue Gesichter
Du fängst wieder an zu strahlen, zum ersten Mal werde ich nicht eifersüchtig
Also hau ab, pack all deinen Kram
Ich hab längst verdaut, dass ich allein auf der Strecke bin
Du hast mir selbst die Idee gegeben, Lügner haben wir auf beiden Seiten
die Absicht kennen wir gut, es gibt kein Interesse, die alte Beziehung zu retten
Die so schön war, wann ist sie so leer geworden
Die Tage, die nicht wiederkommen, du bist für mich eine Last
Also zögere nicht mehr, du kannst jetzt gehen..

Uns beiden wird es besser gehen
 und du kannst jetzt gehen..
Uns beiden wird es besser gehen
 und du kannst jetzt gehen..
Uns beiden wird es besser gehen', 0
FROM `songs` s
WHERE s.`name` LIKE 'Nechápu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Nechápu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ich versteh''s nicht' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Geh', 'Ich sehe diese Kinderträume, ich höre diese Stimmen, die „geh“ sagten,
sie gaben mir Deutungen, wie ich mich vorbereite, diese Tage zu ertragen,
und so ging ich, eine Geschichte made in hell, für diesen Traum hab ich geschuftet.
Durch die Kanäle, und die Jahre vergingen, ich sage mir hundertmal, ich darf es nicht mehr zulassen, ich darf es nicht mehr zulassen,
in meinen eigenen Spuren gehen und alles schaffen, aufrecht wie Pappeln,
jung oder am Stock,
jeder von uns kennt seine Werte, jeder von uns ist ein Prototyp,
deshalb möchte ich um ein bisschen Demut bitten.
Jeder von uns hat seine unerfüllten Träume,
wir träumen nachts von ihnen, wir jagen ihnen den ganzen Tag nach,
jedes Gesicht kennt die Tränen, die darüber laufen,
wenn sich Pech und Chance wieder die Hände reichen.

Ich sehe diese Kinderträume, ich höre diese Stimmen, die „geh“ sagen.
Ich sehe diese Kinderträume, ich höre diese Stimmen, die „geh“ sagen.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Jdi%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Jdi%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Geh' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Liebes Christkind', 'Liebes Christkind, was für eine Schönheit bringst du mir,
liebes Christkind, steck mir das da drüben in ein Tütchen,
liebes Christkind, davon bin ich dann richtig dicht,
liebes Christkind, bring mir dazu noch ein Zwölferpack.

Der vierundzwanzigste Zwölfte, nichts ist besser, als drauf zu sein,
ich weiß nicht, wohin ich gehen soll, ich weiß nicht, was kommt, also paff ich nur Weed, versuch ein bisschen zu trinken,
damit ich den Weihnachtszauber besser kennenlerne,
der Karpfen glotzt mich aus der Badewanne an, ich sag ihm „Frieden“,
mit einem Schlag auf den Hinterkopf erklär ich ihm alles,
leider treffe ich vorher sechsmal daneben.
Die Weihnachtslieder rund ums Radio legen los, gute Zeit, sich wieder abzuschießen,
auf dem Boden rollen, Kurze, kommt zu mir,
die Weihnachtsstimmung verstärke ich mit Rauchen, ich schätze die Nachbarn, sie brachten mir einen Mistelzweig,
danke, auf Wiedersehen, frohe Weihnachten,
ich bin ganz begeistert, der Mistelzweig fliegt in den Müll und ich fliege auf das Weed.

Liebes Christkind, was für eine Schönheit bringst du mir,
liebes Christkind, steck mir das da drüben in ein Tütchen,
liebes Christkind, davon bin ich dann richtig dicht,
liebes Christkind, bring mir dazu noch ein Zwölferpack.

Das Christkind hat mir unter den Baum geschissen, auf einen Zettel geschrieben, ich sei angeblich ein Bastard,
dass ich kiffe und saufe, feiere und bumse, zu Hause rumgammle und mir einen runterhole.
Ich sag nur bla bla, soll es doch quatschen, ich bin ein Idiot, haha, es lebe das Gras,
nicht vielen passiert es, dass das Christkind sie beschimpft, das verkrafte ich psychisch nicht,
also kipp ich mir einen, aus den Augen fließt Lava, ich stürze mich auf die Plätzchen,
so voller Rum, dass ich mich an gar nichts erinnere, null Chance,
alles im Magen zu behalten, ich kotze meterlang.
Am nächsten Morgen sammle ich mich vom Boden auf, Füßchen, tragt mich direkt ins Bett,
heute geht das nicht, heute lasst mich in Ruhe,
gestern Abend war das Christkind furchtbar böse zu mir.

Liebes Christkind, was für eine Schönheit bringst du mir,
liebes Christkind, steck mir das da drüben in ein Tütchen,
liebes Christkind, davon bin ich dann richtig dicht,
liebes Christkind, bring mir dazu noch ein Zwölferpack.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ježíšku panáčku%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Ježíšku panáčku%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Liebes Christkind' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Ich weiß es schon', 'Ich möchte fliegen können, so wie ein Vogel fliegt,
nur mit den Flügeln schlagen, tschüss winken,
von oben auf alles scheißen, mir nichts mehr zu Herzen nehmen
und mit der Hoffnung, die mir bleibt, irgendwo weiterziehen,

Ich möchte fliegen können, so wie ein Vogel fliegt,
nur mit den Flügeln schlagen, tschüss winken,
von oben auf alles scheißen, mir nichts mehr zu Herzen nehmen
und mit der Hoffnung, die mir bleibt, irgendwo weiterziehen,

irgendwohin,
wo kein Stolz regiert, kein blöder Schein,
und die Leute nicht nur gib her, gib her kennen.
Meine Nerven müssen fester sein als der Stahl eines Panzers,
ich schaue mit Abstand darauf, als würde ich
auf dem Gipfel des Mont Blanc stehen.
Yin und Yang gelten längst nicht mehr,
alles Gute, was ich tue, wendet sich immer ins Schlechte,
das Schicksal zahlt mir alles heim, nonstop zahle ich drauf,
aber es kommt die Zeit, in der ich diese Karte umdrehe.

Ich weiß es schon, was passiert ist, sollte passieren,
alles ist Schicksal, es hat keinen Sinn, sich verdammt nochmal dagegen zu wehren.
Ich weiß es schon, es ist manchmal schwerer, als es scheint,
es ist echt widerlich, was dir das Schicksal manchmal bereithält.

Das Leben tritt mir in den Arsch, wirklich mit voller Wucht,
die Ecken meines Lebens hab ich wohl alle besucht,
ich hab jede Scheiße weggeräumt, die mir hier jemand hingelegt hat,
was ich angefasst hab, hab ich immer versaut.

Die Träume wurden zu Staub, in meinen Augen blieb nur Angst,
was kommt jetzt, ich warte, wann der nächste Crash kommt,
was wieder schiefgeht, wer mich wieder reinlegt,
es gibt unter uns solche, die mir ein Messer in den Rücken rammen.

Ich weiß es schon, was passiert ist, sollte passieren,
alles ist Schicksal, es hat keinen Sinn, sich verdammt nochmal dagegen zu wehren.
Ich weiß es schon, es ist manchmal schwerer, als es scheint,
es ist echt widerlich, was dir das Schicksal manchmal bereithält.

Verrat, Schmerz,
ein schlechtes Ende,
Stadt oder Dorf,
lauter Idioten, Egoisten,
sie wollen mich brennen sehen,
sie wollen mich unten sehen,
also leck mich, Alter.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Já už vím'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Já už vím' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ich weiß es schon' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Ganz hinten', 'Du kannst betteln, du kannst knien, du kannst weiterweinen,
es interessiert niemanden, mit allem bist du hier allein.
Alle Probleme ziehen dir im Nu vor den Augen vorbei,
doch jeder geht seinen eigenen dornigen Weg.
(4×)

Du ertrinkst in Schulden, Besserung droht nicht,
zwölf Stunden am Stück auf der Arbeit, arme Bürger,
für die Kinder haben sie keine Zeit, sie müssen schuften, schlafen, morgens aufstehen,
immer wieder Überstunden nehmen, damit es irgendwie reicht.
Du hast so viel erlebt, dass dich nichts mehr überrascht,
eine unerwartete Kündigung auf der Arbeit,
die Arbeit treibt dich bis zum Geständnis, dass du dir in die Hose machst, als du vom Sozialgeld erfährst,
von dem du die Rechnungen zahlen sollst.
Es bleiben nur Augen zum Weinen, nicht mal Kleingeld ist übrig,
übrig ist nur noch ein Penner, der es nicht weit gebracht hat,
und trotzdem ergänzt jeden weiteren Morgen ein gehorsames Schaf die Herde,
manche fürs Fressen, manche fürs Crystal,
sie lassen sich sogar die Haut abziehen.
Ein Haufen Phasen, wie Träume verschwinden, irgendwo dort in der Ferne werden die Wunschbäume ständig gefällt,
auch wenn du dich wehrst, auch wenn du glaubst, dass du aufholst,
kann eine Wende kommen, und wie stehst du dann auf mit dem Gefühl, dass es nichts gibt, wofür es sich lohnt.
Es war OK, jetzt auf Tabletten im weißen Gewand, ganz hinten,
er wird allmählich schwächer, greift allmählich nach dem, was ihm in dem Moment richtig scheint,
für Geklautes Drogen und Schnaps, die Familie beiseite, er macht Angst,
er ist nicht mehr der Kerl von früher, er hat leider aufgegeben,
es war wirklich zu viel, sie fanden ihn letzte Nacht an einem Baum,
auf Papier schrieb er seinen letzten Aufsatz und am Ende, dass er tat, was er konnte.

Du kannst betteln, du kannst knien, du kannst weiterweinen,
es interessiert niemanden, mit allem bist du hier allein.
Alle Probleme ziehen dir im Nu vor den Augen vorbei,
doch jeder geht seinen eigenen dornigen Weg.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%vzadu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%vzadu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ganz hinten' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', NULL, 'Solo, ich will mit dir solo sein,
du und ich, nur wir zwei, die ganze Nacht und um uns nur Dunkelheit.
Solo, ich will mit dir solo sein.

Wir verschwinden, in den Augen Begierde, erwarte keinen Kitsch, ich bin ein Top-Malocher, du bist top, weißt du,
ich will dich ausziehen, ich will dich haben, dich mit zu mir nach Hause nehmen.
Es ist verrückt, wie du immer mehr wirst, wir sind uns immer näher, ich ziele immer tiefer, steige immer höher,
ein Vorzeigemädchen, überall Tattoos, Piercings, Schmuck, nicht wie diese Gäule, total sexy,
nur jetzt will ich nicht, ich will dir eine Lektion für dein Leben geben,
es besser machen, es länger machen als die, die es vorher gemacht haben,
ein Blick reicht und ich weiß, was ich mit diesem perfekten Körper machen soll,
süchtig machend wie Crystal, in der Luft spüre ich Endorphine.

Solo, ich will mit dir solo sein,
du und ich, nur wir zwei, die ganze Nacht und um uns nur Dunkelheit.
Solo, ich will mit dir solo sein, wir fahren die zweite Runde mit Grazie wie Zorro,
pervers, und fast brülle ich dich „toro“ an, das ist ein Mädchen, gehorsam aufs Wort,
sie macht es zu ihrem eigenen Wohl, quietscht wie eine Flöte, spielt mit meiner Kobra, lass mich zwischen deine Schenkel,
ich will mit deiner Muschi spielen, und zwar lange, ihr zeigen, wo''s langgeht, ich will Sex, das ist mein Motto,
schon seit es so weit gekommen ist, dass mir klar wurde, dass das Gute in mir gestorben ist,
schick deine Rede per Post.

Jetzt bist du solo, ich will mit dir solo sein,
du und ich, nur wir zwei, die ganze Nacht und um uns nur Dunkelheit.
Solo, ich will mit dir solo sein,
du und ich, nur wir zwei, die ganze Nacht und um uns nur Dunkelheit.

Solo, ich will mit dir solo sein, in der Badewanne Wasserball,
eine Flut, aber na und, ich kann nicht anders, Lust auf einen tiefen Tauchgang,
eine Medal-of-Honor-Schlacht, ein promovierter Doktor,
ich kenne deine schwachen Stellen: Ohren, Bauch, Leisten,
hör nicht auf, dich zu bewegen, ich schaue gern zu,
ich bin ein hoffnungsloser Fall, das Bett muss quietschen,
die Federn werden fliegen, der Sekt muss spritzen,
sie kann nicht anders, sie muss beißen, kratzen, stöhnen,
ich kann nicht aufhören, stell dir nur ihre Gesten vor,
Pornostar Nummer eins, die bestraft werden will, eine von hundert,
Señora meiner Träume, Lexus-Klasse, also stört uns nicht, ich nehme mir Urlaub und diese Frau.

Jetzt bist du solo, ich will mit dir solo sein,
du und ich, nur wir zwei, die ganze Nacht, aber beide immer noch Single.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Solo%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', NULL, 'Es fing harmlos an, so einmal nach dem Wein,
wir sitzen, wir hängen ab, wir wissen gar nichts von der Welt,
kaum fünfzehn Jahre alt, tja, ahnungslose Jungs,
sie drehen ihre erste grüne Zigarette,
ein schaukelnder Zustand stellt sich ein, wenn du die Tüte anzündest,
mit Lust aufs Leben stürze ich mich in den Strudel der Erkenntnis,
ich hab nicht mal Spucke im Mund, in diesem Rauch löse ich mich auf,
nun ja, diese Pflanze, seit damals jede Stunde.
Essen und Trinken schmecken besser, die Arbeit lässt sich besser überstehen,
der ganze Tag ist fröhlich, also tu nicht so schüchtern,
setz dich in den Kreis, sei kein Trottel, du hast nur ein Leben, also genieß es richtig.

Es ist Ganja, ein mächtiger Zauberer namens Ganja,
ein Retter und ein Heilmittel gegen Traurigkeit und Wut,
kaum einer versteht es, die Leute sind nicht bereit, ein freies Leben zu leben.
(2×)

Gleich am Morgen, sobald ich aufstehe, dreh ich mir ein halbes Gramm,
das andere halbe Gramm lasse ich für später auf dem Programm,
überall Verbote, Pflanzen illegal, das hält mich nicht ab
von der Suche nach idealen Plätzen, wo ich mich hinverziehen und mich von grandiosen Buds verführen lassen kann,
jetzt nur noch drehen, auf den Rücken fallen lassen,
perfekte Zustände genießen, ohne Arbeit, ohne Mühe.
Ja, das mag ich, das macht mir Spaß, Grüße an alle Freunde, die dasselbe tun,
wir sind verzaubert von einem mächtigen, friedlichen Zauber,
mit Alkohol lässt sich das nicht vergleichen.

Es ist Ganja, ein mächtiger Zauberer namens Ganja,
ein Retter und ein Heilmittel gegen Traurigkeit und Wut,
kaum einer versteht es, die Leute sind nicht bereit, ein freies Leben zu leben.
(3×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ganja%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Alter, ey', 'Alter, ey, Alter, ey,
also kapier''s, ich gebe hundert Prozent,
Jahr für Jahr fick ich alles, fick ich dich, fick ich alles in der heutigen Zeit,
entschuldigt, dass ich so bin, arrogant, auf Mohn,
sie können nicht begreifen, dass ich auf die tschechischen Gesetze scheiße.
Tschechische Politik a. k. a. fette Fanatiker,
die verfickte Pointe dieser ganzen Welt,
ich will damit nichts mehr zu tun haben, ich sehe die Ampeln blinken,
deshalb machen wir weiter, es gibt nichts zu warten, Bruder.
Ich fahre in Formation wie Kryptonit, ich explodiere wie Dynamit,
du fühlst dich wie ein Superheld, du willst uns aufhalten, Bruder,
du bist unsere Nahrungsquelle, ein beschissener Wannabe,
der Hater ahnt immer noch nicht, dass seine Karrierestufe endet,
eure Sphären, eure angespielten Seiten, über die Reinheit der Rasse,
eure Routen, religiöse Erlösung,
für mich verfickte Sprüche, ich gehe hundert Prozent zur Sache.

Du kannst nicht weiter, Homie, ohne das bist du echt nicht high,
du weißt selbst nicht, wohin, Taktik, eigener Plan.
(2×)

Die Tschechische Republik, genau richtig für einen Säufer,
dass wir hier leben, ist nicht gerade großes Glück,
Betrug, Bestechung, das ist das Spiel unserer Regierung,
schnell alles teurer machen, wo zum Teufel sollen wir das Geld hernehmen.
Erster im Saufen, Erster bei Drogen, jeder dreht einen Joint,
es ist hier verfault, das ist die ganze Pointe,
ich bin daran gewöhnt, und es kümmert mich nicht mehr,
sei dir sicher, Kumpel, dass ich mich um Qualitäts-Rap kümmere,
Rap ist mein Leben, und das ist kurz,
mal oben, mal unten, na ja, es ist ein bisschen wankelmütig,
das ist mein Style, da kannst du dir sicher sein,
und es ist mir echt egal, Kumpel, was du von mir denkst,
ich habe einfach meinen Weg, einen auserwählten Weg,
auch wenn mir klar ist, dass viele es nicht kapieren,
ich gebe es so, wie ich es gebe, ich lebe, wo ich lebe,
ich kann nichts dagegen tun, ja, ich nehme es so, wie es ist.

Du kannst nicht weiter, Homie, ohne das bist du echt nicht high,
du weißt selbst nicht, wohin, Taktik, eigener Plan.
(2×)

Alter, ey, schau, wie man da unten lebt,
versetz dich wenigstens für eine Weile in meine Rolle,
mir schwitzen die Eier davon, wie ich schuften muss,
und mir ist schlecht, weil ich weiß, wie wenig ich dafür kriege.
Ihr sitzt auf euren Ohren in Krawatten, rausgeputzt, parfümiert, die Brieftaschen übervoll,
es drückt euch in den Arsch und es reicht euch immer noch nicht,
ich bin nicht blind, nicht blöd und auch nicht der Jüngste,
aber ich habe meinen Plan, der mich retten wird,
unsere CD wird überall gut zu kriegen sein.
Wir zeigen dir Dinge, die du bis heute nicht kanntest,
es ist mir egal, dass ich Dinge tue, die nicht legal sind,
die verbotene Frucht gibt es hier überall,
und deshalb rasen die Bullen gern durch mein Dorf,
sie finden es wohl nicht ganz normal,
dass ich für das, was ich mache, keine Steuern zahle.

Pläne und Taktik sagen mir angeblich nichts,
ich wundere mich, wenn ich höre, dass die Leute mir das vorwerfen,
gestern hab ich gemacht, was ich heute mache,
von morgens bis abends hing ich beim Tesco rum,
ich muss ständig saufen, ich will sowieso nicht aufhören,
ich lebe und profitiere nur von den Gaben der Stadt,
oft musste ich auf dem Gehweg übernachten,
ich bin ein Sozialschmarotzer, aus mir stinkt der Verfall,
ich und meine Gang beziehen Position,
Tag für Tag wollen wir Geld von allen um uns herum,
ich setze mich mit einem hungrigen Köter auf den Boden,
du siehst eine Pfote mit einem Hut, du machst einen Bogen um mich,
ich lege es drauf an, ich hab ein blaues Auge,
ich rühre mich nicht vom Fleck, ich bin da, wo ich vor einem Jahr war,
ich bin ein fauler Mistkerl, das Etikett lässt sich nicht abwaschen,
mein Plan ist es, mein ganzes Leben lang mit der Fresse Beton zu pflügen.

Du kannst nicht weiter, Homie, ohne das bist du echt nicht high,
du weißt selbst nicht, wohin, Taktik, eigener Plan.', 0
FROM `songs` s
WHERE s.`name` LIKE 'JML - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'JML - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Alter, ey' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Seltsamer Planet', 'Ein seltsames Gefühl überkommt dich, wenn du die Augen öffnest,
wir haben unsere Finger im Spiel, versucht nicht, euch von Schuld freizusprechen,
lasst uns benehmen, wie sich Gäste benehmen sollen,
zu spät werden wir betteln, wenn hier nur Trümmer bleiben.
(2×)

Ich schlurfe allein einen dunklen und langen Weg entlang,
ich gehe mit gesenktem Kopf, getrübt, verwirrt,
voller Gedanken, die einfach nicht weggehen,
nur Menschen gehen, schöne Erinnerungen nehmen sie mit,
und dabei nehmen sie einen Preis mit, der für mich unerträglich ist,
es ist fake wie ein Henna-Tattoo,
eine Weile sind sie da und dann lachen sie,
tja, auf einem seltsamen Planeten passieren seltsame Dinge.
Ich steuere ins Unwetter, wo alle auf Schönheit schauen,
Mädchen messen eine Beziehung an der Länge der Schwänze,
wo ist der Elan geblieben, früher hatte ihn jeder Herr,
ein Gentleman an jeder Ecke öffnete den Damen die Tür, und heute,
wo ich auch hinschaue, hat jemand jemanden entführt,
es ist Grauen, Wahnsinn, überall abgeholzter Wald,
auf unserem Planeten kann nur die Industrie blühen,
und dieser Planet ist wie ein Käfig, aus dem du nicht fliehen kannst,
Kriege, Rassismus, Drogen, Mörder,
so viele Fallen, die Menschen in die Knie zwingen,
eine abgeprallte Kugel, die einen kleinen Jungen tötete,
für die Familie ist das eine unvorstellbare Qual,
Alkohol am Steuer, Drogen auf den Straßen,
neben der Straße Dreck, wohin steuert diese Welt,
bei dem, was passiert, bleibt mir langsam der Verstand stehen,
denn ich stehe mit euch auf einem Schiff, das bald untergeht.

Und was ist das? Und wo bin ich?
Ist das die Wirklichkeit oder nur ein blöder Traum?
Bin ich etwa ein Idiot, oder hast du auch das Gefühl,
dass unsere Erde direkt vor unserer Nase ins Verderben rast?

Schritt für Schritt gehst du durchs Leben,
du kämpfst um deinen Platz an der Sonne,
du willst kein Sklave sein, du sorgst dich um die Zukunft,
aber du kannst kaum wissen, was hinter der Ecke passiert,
schau, deine Pläne können schnell verrecken,
in einem Moment ist alles anders, du schaffst es nicht mal, dich zu bewegen,
dieser seltsame Planet fegt mit den Schicksalen herum,
der Tod kommt wie ein Arschloch und schneidet dir die Kehle durch.
Die Menschheit lernt nicht dazu, Feindseligkeit regiert die Welt,
kleine Kinder drücken die Finger auf den Abzug eines Maschinengewehrs,
eine Ewigkeit sehen wir das hier schon,
wir schließen die Augen, wir sitzen ganze Stunden im Netz ab,
wir arbeiten, wir tragen zum Aufschwung bei,
wir töten verdammt nochmal den Großteil unserer Zeit,
du wartest auf das Datum, an dem du deinen Lohn kassierst,
du wunderst dich, Roboter, dass du dir nicht die Taschen gefüllt hast.
Die Leute hetzen ständig, obwohl sie nicht wissen, wohin,
das Leben verliert langsam, aber sicher seinen Sinn,
Leben und Qualität werden heute in Geld gemessen,
dass Wahrheit und Liebe siegen werden, glaubt niemand mehr,
es gibt keinen Platz für Gefühle, wir bauen Karrieren,
wir verwüsten die Landschaft, wir errichten Barrieren,
rücksichtslos blasen wir Scheiße in die Atmosphäre,
was werden wohl unsere Söhne und Töchter atmen.
Ich versuche nicht, die Heilsarmee zu spielen,
mich kotzt nur an, wie der Mensch den Ast absägt, auf dem er sitzt,
Fakten und das Problem zu ignorieren, zahlt sich nicht aus,
nicht einmal die Heiligen helfen, alles kommt zu uns zurück.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Divná planeta%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Divná planeta%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Seltsamer Planet' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Alter, ey', 'Alter, ey, schau, wie man da unten lebt,
versetz dich wenigstens für eine Weile in meine Rolle,
mir schwitzen die Eier davon, wie ich schuften muss,
und mir ist schlecht, weil ich weiß, wie wenig ich dafür kriege.
Ihr sitzt auf euren Ohren in Krawatten, rausgeputzt, parfümiert, die Brieftaschen übervoll,
es drückt euch in den Arsch und es reicht euch immer noch nicht,
ich bin nicht blind, nicht blöd und auch nicht der Jüngste,
aber ich habe meinen Plan, der mich retten wird,
unsere CD wird überall gut zu kriegen sein.
Wir zeigen dir Dinge, die du bis heute nicht kanntest,
es ist mir egal, dass ich Dinge tue, die nicht legal sind,
die verbotene Frucht gibt es hier überall,
und deshalb rasen die Bullen gern durch mein Dorf,
sie finden es wohl nicht ganz normal,
dass ich für das, was ich mache, keine Steuern zahle.

Pläne und Taktik sagen mir angeblich nichts,
ich wundere mich, wenn ich höre, dass die Leute mir das vorwerfen,
gestern hab ich gemacht, was ich heute mache,
von morgens bis abends hing ich beim Tesco rum,
ich muss ständig saufen, ich will sowieso nicht aufhören,
ich lebe und profitiere nur von den Gaben der Stadt,
oft musste ich auf dem Gehweg übernachten,
ich bin ein Sozialschmarotzer, aus mir stinkt der Verfall,
ich und meine Gang beziehen Position,
Tag für Tag wollen wir Geld von allen um uns herum,
ich setze mich mit einem hungrigen Köter auf den Boden,
du siehst eine Pfote mit einem Hut, du machst einen Bogen um mich,
ich lege es drauf an, ich hab ein blaues Auge,
ich rühre mich nicht vom Fleck, ich bin da, wo ich vor einem Jahr war,
ich bin ein fauler Mistkerl, das Etikett lässt sich nicht abwaschen,
mein Plan ist es, mein ganzes Leben lang mit der Fresse Beton zu pflügen.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Skeli a Babar - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Skeli a Babar - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Alter, ey' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'de', 'Ein gewöhnlicher Mensch', 'Angeblich soll ich lächeln, mit der Herde ziehen,
den Leuten in den Arsch kriechen, ihn wahrscheinlich sogar abwischen,
ich sollte mich angeblich zügeln und aufhören, es so auf die Spitze zu treiben,
und mich damit abfinden, wie es ist, mit den Füßen schlurfen, den Kopf senken.
Kümmer dich nicht darum, daran änderst du nichts, du kannst nichts tun,
denk nicht nach, schalt das Hirn ab, schufte, bis der Körper reißt,
deine Meinung behältst du am besten für dich,
du bist nicht hier, um den Lauf der schlechten Dinge zu ändern.

Du bist ein gewöhnlicher Mensch, dein Los ist es, in der Scheiße zu wühlen,
das ganze Leben die Rechnung abzahlen, dich mitschleifen lassen,
dein Zug ist schon in dem Moment abgefahren, als du die Welt erblickt hast,
also halt die Klappe, geh im Gleichschritt und reih dich wieder ein.
(2×)

Ich bin ein kleiner Wichser, fast anderthalb Meter groß,
ich strecke den Kopf aus der Menge, sie wollen mich auf einen Pfahl spießen,
ich hab harte Schläge eingesteckt, sie streuen mir Salz hinein,
unzählige Schläge werde ich noch einstecken,
sie fliegen von allen Seiten, und ich mache Dinge nicht nur, weil sie cool wären,
ich habe nicht dieselben Hobbys wie jeder zweite Ochse,
für meinen Charakter büße ich ständig, wie ich es verdiene,
es ist Mist, dass ich erfolgreich aus dem Durchschnitt herausfalle,
niemand darf unter dem Durchschnitt oder über dem Durchschnitt stehen,
behalte deine Träume für dich, schau, dass du sie dir verdammt nochmal nimmst,
du musst nur schuften, schlafen, schuften, schlafen, schuften, schlafen,
Scheiße verdienen, Scheiße direkt ins Klo scheißen, danke, kein Interesse,
mit der Herde zu gehen, ich bin echt nicht verrückt, ich folge meinem eigenen Plan,
deine Meinung behältst du am besten für dich,
ich gehe meinen eigenen Weg, solange mir der Atem reicht.

Du bist ein gewöhnlicher Mensch, dein Los ist es, in der Scheiße zu wühlen,
das ganze Leben die Rechnung abzahlen, dich mitschleifen lassen,
dein Zug ist schon in dem Moment abgefahren, als du die Welt erblickt hast,
also halt die Klappe, geh im Gleichschritt und reih dich wieder ein.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Obyčejnej člověk%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'de')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Obyčejnej člověk%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ein gewöhnlicher Mensch' WHERE l.`lang` = 'de' AND (l.`title` IS NULL OR l.`title` = '');

-- uk
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Драма', 'Хочу коштовний камінь, не хочу Памелу-шльондру,
але якщо вона хоче, можу дати тобі дим,
вона спокійно підставить мені піраміду, я вставлю, потім поїду,
прийде брат, перейме естафету, не вдавай, що ти не сиділа на наркоті,
не вірю тобі ані слову, тобі знову ллє в черевики, в роті не один член,
на цьому ти робиш собі промо, переді мною не грай невинну,
RDM або Zoom, тоді відправимо тебе наступним псам, тоді відправимо тебе наступним псам,
RDM або Zoom, тоді відправимо тебе наступним псам.

Взяла його в рот і тут, і там,
гавкати в будку, на дно тебе затягне,
її єдині friends лише на OnlyFans,
у неї немає жодних меж, віддається всім.

Сумочки, черевички і нова тачка,
подрочить, відсмокче — і зароблено,
найдавніше ремесло годує тебе тепер,
твої фотки заполонили мережу.

Тіло в обігу, голова offline,
забирають руки, щойно тебе пізнають,
нульові цінності, ти не леді,
що каже на твою кицьку твоя мама?

Передай їй привіт, помахай ділдо,
у тебе закінчився характер, ти вирішуєш це пільзнером,
кожен візьме з тебе лише шматочок,
бази даних самі не видаляться.

Тобі байдуже, головне, що ти заробляєш бабло,
easy money за своє тіло, гідність — бувай.
Тобі байдуже, головне, що ти заробляєш бабло,
easy money за своє тіло, гідність — бувай.

Сучка думає, що може мене підставити, але в неї не вийде,
хотіла, щоб я на неї кінчив, але я кажу їй: крихітко, ні, ні, ні, ні,
з такою я б не був, я не дурний, я б ніколи не зрадив себе.
Мені цікаво, куди зникла ваша цінність,
вона зникла, коли ви за гроші ганялися за членами,
тож слово «жінка» вам нічого не каже,
а те, що вона добре одягається, нічого не означає.

Zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
let''s go, zoom, zoom,
увімкніть це на шоу, і хай усі почують, хай вибухають колонки,
цей трек не sweet, не candy, справді не candy,
дівко, ти стули пельку, ти не маєш слова, тепер говорять чорти,
та друга хай відійде вбік і чекає на мене до вечора,
дівка роздає weed, думає, що ніхто не знає, думає, що приховає,
мені розповіло її оточення, вона даватиме кожному, з неї вийде дурна корова,
але одного дня її спалить лава, а я танцюватиму танго і вальс.

Вона дурна корова і любить влаштовувати драму,
демони, поспіх, вона на хвилі, повертаються спиною,
на випивці ламається, дасть кожному,
і самоповага зникла, вона вже не така мила.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Zoom - Drama%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Zoom - Drama%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Драма' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Тік-так', 'Може, ви вже забули, але я досі тут,
ми боремося з життям, прокладаємо собі шлях.
Я мету перед своїм порогом, вперед не пхаюся,
спостерігаю здалеку, як дітлахи розсипають доріжки.

Обсмажені з п''ятнадцяти, життя, мабуть, бомба,
втягують це в рило, замикають собі клітку.
Тік-так, тік-так — наближається великий fuck,
з усвідомленням, що від мозку лишилась сама бринза.
Ти озираєшся через плече, тебе тримає параноя.

Виглядаєш копів, а раптом прийдуть,
забрали б у тебе кратом, і перук теж.
Усі ті пакетики висипали б,
хочеш зникнути швидко, як Фіттіпальді.
Усі твої купи — що таке реальність?
Твоє life, велика катастрофа, Mortal Kombat, fatality.
Ведуть тебе до своєї «Октавії», на руках відчуваєш кайданки,
над собою не бачиш неба, під тобою лава.
Я бачив це, коли йшов із риболовлі,
відчуваєш свій страх, божевільний трип,
приходить відходняк, смакуєш лайно.

З кожним хочеш розборок, винна в цьому та порожня хватка,
не знаєш, коли сказати стоп, не вчишся на власних помилках.
Можеш почати копати собі могилу, потім на це не лишиться сил,
сподіваюсь, для тебе не буде шоком, що ти не повернеш хід речей.

Воно перемеле тебе саме, перемеле, перемеле, перемеле саме,
воно забере в тебе заряд, забере, забере заряд.
Воно зжере твою душу, воно зжере твоє обличчя,
що посієш, те й пожнеш,
твоя пика виглядає як гербарій,
ти розсипаєшся, як сфінкс.

З кожним хочеш розборок,
винна в цьому та порожня хватка,
не знаєш, коли сказати стоп,
не вчишся на власних помилках.
Можеш почати копати собі могилу,
потім на це не лишиться сил,
сподіваюсь, для тебе не буде шоком,
що ти не повернеш хід речей.

Тік-так, тік-так, у тебе закінчується час,
тік-так, тік-так, ти безнадійний випадок,
тік-так, тік-так, нескінченна параноя.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tik Tak%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tik Tak%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Тік-так' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Тисяча шматків', 'веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити

веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити
я шукаю сам себе і не знаю, з чого почати
мені бракує шматка органу, що має гнати мене вперед
я не знаю, що від мене лишилось, чи це ще я
тіло без душі і душа без тіла
мене розірвали на тисячу шматків, а потім пішли далі

пішли далі

веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити

веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити

а тепер я шукаю сліди, якими вже колись ішов
не знаю, що сталося, що я про все це забув
я викинув компас, що показував правильний напрямок
я дав течії нести себе, як човник без весел
і час пливе, і я знаю, що змарнований час уже ніяк не поверну
двері, які я відчинив, уже майже зачинені
може, я ще маю шанс досягти успіху, може, ще не все втрачено

веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити

веселі треки з мене зараз справді не дуже йдуть
обгризений комплексами, я дав себе знищити', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tisíc kousků%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tisíc kousků%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Тисяча шматків' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Musíš odejít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ти мусиш піти' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Чілимо', 'Коли ми чілимо разом, вигляд у нас страшенно мудрий
Коли ми чілимо разом, ми пливемо морем диму
Коли ми чілимо разом, атмосфера гарно густішає
з кожним наступним шматочком, що прослизає нам у горло

Коли ми чілимо разом, вигляд у нас страшенно мудрий
Коли ми чілимо разом, ми пливемо морем диму
Коли ми чілимо разом, атмосфера гарно густішає
з кожним наступним шматочком, що прослизає нам у горло

це могутній чарівник на ім''я weed, після нього все таке B.I.G
ми одна команда, як G.I. JOE, тож не напружуй нас, це лише JOINT
будь ласка, не будь дурним BOY, не напружуй, не напружуй, НЕ НАПРУЖУЙ
ми не загроза, бо ми розуміємо це, як мало хто
ми чілимо, чілимо постійно, поки в роті дрімає косяк
кінець товстий, як палець, тягнемо його, як справжній ссавець
затримуємо, як справжній знавець, потім голодні, як хижак
біжу взяти якоїсь жратви, а потім можемо знову WEED

затяжки, бланти, бонги, ми воюємо на всіх фронтах
по кишенях папірці, фільтри для «відра», косяки, індика, сатива, з-під лампи, з вулиці
гриндер перемелює нам шишку, мелемо, мелемо, мелемо грам
вдома чи надворі, з компанією чи сам, затягуюсь жирним, а потім співаю

Коли ми чілимо разом, вигляд у нас страшенно мудрий
Коли ми чілимо разом, ми пливемо морем диму
Коли ми чілимо разом, атмосфера гарно густішає
з кожним наступним шматочком, що прослизає нам у горло

Коли ми чілимо разом, вигляд у нас страшенно мудрий
Коли ми чілимо разом, ми пливемо морем диму
Коли ми чілимо разом, атмосфера гарно густішає
з кожним наступним шматочком, що прослизає нам у горло

Нам ніколи не досить, перестати, дурню? та нема для чого
ти не знаєш того стану, якого так багато, мир і любов, жодної злості
ми чілимо, чілимо постійно, завжди в роті дрімає косяк
завжди кінець, як палець, завжди тягнемо, як ссавець
завжди затримуємо, як знавець, накрутили цілий клунок
апетит усе не слабне, тож давай сюди ще косяк', 0
FROM `songs` s
WHERE s.`name` LIKE 'Chillujem%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Chillujem%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Чілимо' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Файно', 'А карти в нас давно роздані
ми простягаємо руки до тих речей, що нас поставлять на ноги
хоч і несвідомо, ніби піддані
ми видаємо результати, які вони за нас продають

з думкою про кожен наступний кращий день
вставати рано-вранці, ну ж бо, вівці, йдемо
прогризатися крізь щоденний процес
за милостиню здираємо з себе шкіру
хай їм буде файно, хай їм буде файно, хай їм буде файно

з вершини піраміди світ, мабуть, виглядає файно
а що ж той решта, яка мусить стояти в її тіні
чи ти питав їх, чи їм файно,
чи їм файно, чи їм файно

вчора приїхав на бумері, завтра візьме на клас вищу, знаєш
у мене перед будинком стоїть тачка, що вже починає гнити
рахунки накопичуються, підкрутили зарплатний лист
трохи чогось у холодильник, гаманець у мене порожній

А карти в нас давно роздані
ми простягаємо руки до тих речей, що нас поставлять на ноги
хоч і несвідомо, ніби піддані
ми видаємо результати, які вони за нас продають

кажу досить !!!

беру це у власні руки й піду своїм шляхом
мені вже набридло заробляти на чужі мрії
на твою довбану відпустку

тож бувай файно, я ловлю вайб і роблю страйк
падаван прагне почути той хайп
падаван хоче отримати ще один лайк
падаван стане майстром, і та злиденність зникне назавжди
тепер лише чисті руки, з сантехніком котіться кудись під три чорти
я хочу отримати більше, ніж лише пхати брудні труби в ті стіни
я хочу отримати більше, ніж лише пхати брудні труби в ті стіни', 0
FROM `songs` s
WHERE s.`name` LIKE 'Fajn%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Fajn%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Файно' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', NULL, 'Я ще навіть не влетів на сцену, а вже бажають, щоб я здох,
щоб я загасив це, щоб я спіткнувся, що я нібито мудак, який уміє лише хрінь,
навіть не хрінь, кінець кічу, в ці біти я впрусь, як вітер,
не чекай собачого лайна, я приношу хіт плюс, шукай нову кицьку,
після цього шиту вона хоче бути на моєму dick''у.

Тож звикай, я розкручую бізнес, у мене є важіль, щоб змінити своє життя,
передати це далі, піднятися вище, чесний трудяга,
заробити мільйон і жити краще, сіяти top seed, палити top weed,
почати жити життя, перестати животіти, підкинути під котел,
не зважати на мудаків, ааа...

Підкинути під котел, не зважати на мудаків, ааа...
Підкинути під котел, не зважати на мудаків, ааа...
Підкинути під котел, не зважати на мудаків, ааа...

Скільки хіту, стільки хейтерів!
Стільки хейтерів!', 0
FROM `songs` s
WHERE s.`name` LIKE 'Machine gun%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Ми мусимо жити', 'Навіть коли болить, ми мусимо йти,
час рани гоїть, знаєш, ми мусимо жити.

Навіть якщо вчора було паскудно,
сьогодні на мене чекає новий день,
що б не було попереду,
я не вірю, що щось неможливо.
Я не завжди позитивний тип,
я теж часом сягав дна,
але так просто ви мене не позбудетесь,
я щось на зразок Саурона.
Навіть коли немає грошей, у школі все хріново,
так, я постійно на роботі,
але навіть не наблизився до великих грошей,
тож у житті я не здамся,
пахатиму доти,
доки з мене не вийде зірка,
я хотів би літати в небі,
але не належати до авіації.
Бум, оце саме той звук, як я йду до цього,
я справді над чимось працюю,
поки ти пишеш це у Facebook,
я нічого не отримав від тата,
мамі я хотів би все повернути,
ніщо не впаде тобі саме на коліна,
ти мусиш бути готовим іти далі, навіть до своєї мети.
Друже, я дуже добре знаю, що означає
жити в злиднях, як спійманий у сітку,
тобі здається, що все летить під три чорти,
але саме про це вся історія,
не будь розбещеним, як дитина.

Навіть коли болить, ми мусимо йти (мусимо йти),
час рани гоїть, знаєш, ми мусимо жити (мусимо жити).
Навіть коли болить, ми мусимо йти (мусимо йти),
час рани гоїть, знаєш, ми мусимо жити (мусимо жити).

Я вже стільки разів провалювався і програвав,
але ніколи не питав, чому я,
я просто піднявся і пішов далі,
я дуже хотів би вигравати кожен матч
і святкувати, як датчанин, але тоді я ніколи
не мав би такої покори, як тепер.
Пройти крізь пекло краще,
ніж мати все під носом
і жити лише як поверховий комік чи мудак,
який нічого не знає про життя,
сміх — це радше до сліз,
бо без болю не пізнаєш, що таке щастя.
І я стільки разів падав мордою вниз,
що краще вже не рахую,
і радше думаю про те, скільки дам,
ніж про те, скільки мав би взяти,
я знаю, що краще віддати пас,
ніж усе зіпсувати й зовсім не виграти.
І тож я стою далі, твердо обома ногами на землі,
і працюю над тим,
щоб одного дня пережити кожну мрію, яка мені снилася,
світ часом складний,
я в ньому й сам не розбираюсь,
і в мене так само, як у вас,
ніхто з вас у цьому не самотній.

Навіть коли болить, ми мусимо йти (мусимо йти),
час рани гоїть, знаєш, ми мусимо жити (мусимо жити).
Навіть коли болить, ми мусимо йти (мусимо йти),
час рани гоїть, знаєш, ми мусимо жити (мусимо жити).', 0
FROM `songs` s
WHERE s.`name` LIKE 'Refew - Musíme žít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Refew - Musíme žít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ми мусимо жити' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Не розумію', 'Не розумію, звідки в нас береться це зло
Не розумію, чому воно в нас постійно бореться
Не розумію, звідки в нас береться це зло
Звідки в нас береться це зло
Чому воно в нас постійно бореться

Ми любимо одне одного, нас обох гризе сидіти поруч
Ми годуємо себе медом, а в ньому отрута
І ці x років із питанням, чи це востаннє
Ми прощаємось, нас постійно випробовують
Ми постійно намагаємось бути призначеними одне одному
Піти назустріч і не сказати більше
Ніж те, що конче потрібно
Але так не можна, але так не можна
Але так не можна, бути разом за звичкою
Справді не можна, я тягнуся до дверної ручки
Хочу зникнути, кличу mayday, навколо нас сітка
Зшита зі спогадів і тих місць
Ми вже знаємо, що це не так, як раніше
Тепер лише рипить, але в інших ліжках

А зранку ніби нічого, зранку ніби нічого
А зранку ніби нічого, зранку ніби нічого

Фальшиві ілюзії, правдива брехня
За сніданком згадуємо дні, коли ми були командою
Ми жили з тим, що я Цезар, а вона мій Рим
Фальшиві ілюзії, правдива брехня
За сніданком згадуємо дні, коли ми були командою
Ми жили з тим, що я Цезар, а вона мій Рим

І тому я не розумію, звідки в нас береться це зло
Не розумію, чому воно в нас постійно бореться
Не розумію, звідки в нас береться це зло
Звідки в нас береться це зло
Чому воно в нас постійно бореться

Але нам цього було мало
І давно ми не знаходимо причини це далі тягнути
У нас досі є давні спогади
Цей зв''язок кількох років — це те, що нас тепер в''яже одне з одним
У нас ще одна зарубка, ти шукаєш нові обличчя
Ти знову починаєш сяяти, вперше я не починаю ревнувати
Тож вимітайся, збирай усі свої манатки
Я давно перетравив, що я сам на трасі
Ти сама дала мені ідею, брехуни в нас з обох боків
намір ми добре знаємо, немає жодного бажання рятувати ті давні стосунки
Які були такі прекрасні, коли вони стали такими порожніми
Ті дні, що не повернуться, ти для мене тягар
Тож не зволікай більше, вже можеш іти..

Нам обом буде краще
 і вже можеш іти..
Нам обом буде краще
 і вже можеш іти..
Нам обом буде краще', 0
FROM `songs` s
WHERE s.`name` LIKE 'Nechápu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Nechápu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Не розумію' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Іди', 'Я бачу ті дитячі мрії, чую ті голоси, що казали «іди»,
вони давали мені тлумачення, як підготуватися витримати ті дні,
і тож я пішов, історія made in hell, заради тієї мрії я гарував.
Каналізацією, а роки все пливли, кажу собі сто разів, я більше не можу цього допустити, не можу цього допустити,
йти власними слідами й досягти будь-чого, прямо, як тополі,
молодим чи з палицею,
кожен із нас знає свої цінності, кожен із нас — прототип,
тому я хочу попросити трохи покори.
У кожного з нас є свої нездійснені мрії,
ми мріємо про них ночами, йдемо за ними цілими днями,
кожне обличчя знає, як по ньому стікають сльози,
коли невдача з шансом знову подають одне одному руки.

Я бачу ті дитячі мрії, чую ті голоси, що кажуть «іди».
Я бачу ті дитячі мрії, чую ті голоси, що кажуть «іди».', 0
FROM `songs` s
WHERE s.`name` LIKE '%Jdi%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Jdi%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Іди' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Ісусику, любий', 'Ісусику, любий, яку красу ти мені несеш,
Ісусику, любий, поклади мені оте в пакетик,
Ісусику, любий, від цього я буду в повний драбадан,
Ісусику, любий, принеси мені до цього ще дванадцятку пива.

Двадцять четверте грудня, немає нічого кращого, ніж бути вгашеним,
не знаю, куди мені йти, не знаю, що буде, тож просто пахкаю weed, трохи пробую пити,
щоб краще пізнати різдвяні чари,
короп витріщається на мене з ванни, я кажу йому «мир»,
одним ударом по потилиці я йому все поясню,
на жаль, перед тим шість разів не влучу.
Колядки довкола радіо розігналися, добрий час знову відірватися,
качатися по підлозі, чарки, ходіть до мене,
різдвяний настрій посилюю курінням, ціную сусідів, принесли мені омелу,
дякую, до побачення, щасливого Різдва,
я весь у захваті, омела летить на смітник, а я лечу на той weed.

Ісусику, любий, яку красу ти мені несеш,
Ісусику, любий, поклади мені оте в пакетик,
Ісусику, любий, від цього я буду в повний драбадан,
Ісусику, любий, принеси мені до цього ще дванадцятку пива.

Ісусик насрав мені під ялинку, на записці написав, що я нібито виродок,
що я курю траву й бухаю, тусуюсь і трахаюсь, валяюся вдома і дрочу.
А я на це бла-бла, хай собі патякає, я дурень, ха-ха, хай живе трава,
не з багатьма таке трапляється, щоб на них сварився Ісусик, психічно я цього не витримую,
тож прикладаюся до пляшки, з очей тече лава, кидаюся на печиво,
воно таке ромове, що я нічого не пам''ятаю, жодних шансів
утримати все в нутрощах, блюю метровими струменями.
Наступного ранку я збираю себе з підлоги, ніжки, несіть мене прямо в ліжко,
сьогодні не вийде, сьогодні дайте мені спокій,
учора ввечері Ісусик був до мене страшенно злий.

Ісусику, любий, яку красу ти мені несеш,
Ісусику, любий, поклади мені оте в пакетик,
Ісусику, любий, від цього я буду в повний драбадан,
Ісусику, любий, принеси мені до цього ще дванадцятку пива.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ježíšku panáčku%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Ježíšku panáčku%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ісусику, любий' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Я вже знаю', 'Я хотів би вміти літати, так, як літає птах,
лише змахнути крилами, сказати па-па,
з висоти на все це насрати, нічого вже не брати близько до серця
і з рештою надії рушити кудись далі,

Я хотів би вміти літати, так, як літає птах,
лише змахнути крилами, сказати па-па,
з висоти на все це насрати, нічого вже не брати близько до серця
і з рештою надії рушити кудись далі,

кудись туди,
де не панує гордість, дурний обман,
і люди не знають лише «дай-дай».
Мої нерви мусять бути міцнішими за сталь танка,
я дивлюся на це згори, ніби я стояв
на вершині Монблану.
Інь і ян давно вже не діють,
усе добре, що я роблю, завжди обертається на погане,
доля мені все відплачує, я нон-стоп за це розплачуюсь,
але прийде час, коли я переверну ту карту.

Я вже знаю, що сталося, мало статися,
усе це доля, немає сенсу з цим, бляха, боротися.
Я вже знаю, часом це важче, ніж здається,
це справді гидота, що доля тобі часом готує.

Життя дає мені по дупі, справді на повну,
всі куточки свого життя я, мабуть, уже відвідав,
я вигріб кожне лайно, яке мені тут хтось підготував,
до чого я торкався, те я завжди псував.

Мрії перетворилися на прах, у моїх очах лишився сам страх,
що ж буде далі, чекаю, коли прийде наступний крах,
що знову зіпсується, хто мене знову підставить,
серед нас є такі, хто встромить мені ножа в спину.

Я вже знаю, що сталося, мало статися,
усе це доля, немає сенсу з цим, бляха, боротися.
Я вже знаю, часом це важче, ніж здається,
це справді гидота, що доля тобі часом готує.

Зрада, біль,
поганий кінець,
місто чи село,
самі дурні, егоїсти,
хочуть бачити, як я згорю,
хочуть бачити мене внизу,
тож вилижи, чувак.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Já už vím'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Já už vím' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Я вже знаю' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'У самому кінці', 'Можеш благати, можеш стояти на колінах, можеш далі плакати,
нікого це не цікавить, з усім ти тут сам.
Усі проблеми вмить промайнуть перед твоїми очима,
та кожен іде своїм тернистим шляхом.
(4×)

Ти тонеш у боргах, покращення не загрожує,
дванадцять годин поспіль на роботі, бідолашні громадяни,
на дітей не мають часу, мусять пахати, спати, вранці вставати,
знову й знову брати понаднормові, щоб сяк-так протягнути.
Ти пережив стільки, що тебе вже ніщо не дивує,
несподіване підписання звільнення з роботи,
робота доводить тебе до зізнання, що ти обісрався, коли дізнався про соціальну зарплату,
з якої ти маєш платити рахунки.
Лишаються очі для плачу, не лишилося навіть дрібняків,
лишився лише ще один жебрак, який далеко не зайшов,
і все одно кожного наступного ранку слухняна вівця поповнює стадо,
хтось заради жратви, хтось заради перуку,
дасть навіть шкуру з себе здерти.
Купа фаз, як зникають мрії, десь там удалині дерева бажань, які весь час рубають,
навіть коли ти боронишся, навіть коли тобі здається, що ти наздоганяєш,
може статися поворот, і як тоді встати з відчуттям, що немає за що стояти.
Було все ОК, тепер на пігулках у білому вбранні, у самому кінці,
поступово слабне, поступово тягнеться до того, що в ту мить здається правильним,
за крадене — наркота й випивка, сім''я осторонь, від нього віє страхом,
він уже не той чоловік, він, на жаль, здався,
це вже було справді забагато, його знайшли на дереві минулої ночі,
на папері він написав свій останній твір, а наприкінці — що робив, що міг.

Можеш благати, можеш стояти на колінах, можеш далі плакати,
нікого це не цікавить, з усім ти тут сам.
Усі проблеми вмить промайнуть перед твоїми очима,
та кожен іде своїм тернистим шляхом.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%vzadu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%vzadu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'У самому кінці' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Соло', 'Соло, я хочу бути з тобою соло,
ти і я, лише ми двоє, всю ніч, і навколо нас лише темрява.
Соло, я хочу бути з тобою соло.

Ми зникаємо, в очах жага, не чекай кічу, я топ-трудяга, ти топ, знаєш,
хочу тебе роздягнути, хочу тебе мати, забрати тебе до себе додому.
Це божевілля, як тебе все більше й більше, ми все ближче й ближче, я цілюсь все нижче й нижче, піднімаюсь все вище й вище,
дівчина на виставку, всюди тату, пірсинг, прикраси, не як ті шкапи, абсолютно сексі,
лише зараз я не хочу, я хочу дати тобі урок для твого життя,
робити це краще, робити це довше, ніж ті, хто робив це раніше,
досить одного погляду, і я вже знаю, що робити з цим ідеальним тілом,
викликає залежність, як перук, у повітрі я відчуваю ендорфін.

Соло, я хочу бути з тобою соло,
ти і я, лише ми двоє, всю ніч, і навколо нас лише темрява.
Соло, я хочу бути з тобою соло, їдемо другий раунд із грацією, як Зорро,
збочений, і я майже реву на тебе «торо», ото дівчина, слухняна з півслова,
вона робить це для свого ж блага, пищить, як флейта, грається з моєю коброю, пусти мене між стегна,
я хочу гратися з твоєю кицькою, і то довго, показати їй, що й до чого, я хочу секс, це мій девіз,
ще з тих пір, як дійшло до того, що я зрозумів, що добро в мені здохло,
промову надішли поштою.

Тепер ти соло, я хочу бути з тобою соло,
ти і я, лише ми двоє, всю ніч, і навколо нас лише темрява.
Соло, я хочу бути з тобою соло,
ти і я, лише ми двоє, всю ніч, і навколо нас лише темрява.

Соло, я хочу бути з тобою соло, у ванні водне поло,
потоп, але ну й що, я не можу втриматись, хочу глибокого занурення,
битва Medal of Honor, дипломований доктор,
я знаю твої слабкі місця: вушка, животик, пах,
не переставай рухатися, мені подобається на це дивитися,
я безнадійний випадок, ліжко мусить рипіти,
пір''я літатиме, шампанське мусить бризкати,
вона не може втриматись, мусить кусатися, дряпатися, стогнати,
я не можу зупинитися, лише уяви ці її жести,
порнозірка номер один, яка хоче бути покараною, одна на сотню,
сеньйора з моїх мрій, клас Lexus, тож не заважайте нам, я беру відпустку і цю жінку.

Тепер ти соло, я хочу бути з тобою соло,
ти і я, лише ми двоє, всю ніч, але обоє досі самотні.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Solo%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Solo%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Соло' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Ганджа', 'Почалося все невинно, якось так після вина,
ми сидимо, байдикуємо, про світ зовсім нічого не знаємо,
ледве п''ятнадцять років, ну що ж, необізнані хлопці,
вони скручують свою першу зелену цигарку,
приходить хиткий стан, коли ти підпалюєш той косяк,
зі смаком до життя я кидаюся у вир пізнання,
у роті навіть слини немає, у цьому диму я розчиняюсь,
що ж, цю рослину відтоді щогодини.
Їжа й питво смакують краще, на роботі легше вижити,
увесь день веселий, тож не вдавай, що ти сором''язливий,
сідай у коло, не будь бовдуром, життя в тебе лише одне, тож насолоджуйся ним як слід.

Це ганджа, могутній чарівник на ім''я ганджа,
рятівник і ліки від смутку й гніву,
мало хто це зрозуміє, люди не готові жити вільним життям.
(2×)

Одразу вранці, щойно встану, скручую собі пів грама,
ще пів грама лишаю на потім у програмі,
всюди заборони, рослини нелегальні, але мені це не завадить
шукати ідеальні місця, куди можна залізти й дати себе спокусити грандіозним шишкам,
тепер лишилося тільки скрутити, впасти на спину,
насолоджуватися ідеальними станами без роботи, без зусиль.
Так, оце я люблю, оце мені подобається, вітаю всіх друзів, які роблять те саме,
ми зачаровані могутнім миролюбним закляттям,
це не можна порівняти з випивкою.

Це ганджа, могутній чарівник на ім''я ганджа,
рятівник і ліки від смутку й гніву,
мало хто це зрозуміє, люди не готові жити вільним життям.
(3×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ganja%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Ganja%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ганджа' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Оце так, чувак', 'Оце так, чувак, оце так, чувак,
тож зрозумій, я йду на сто відсотків,
рік за роком я їбу все, їбу тебе, їбу все в сьогоднішні часи,
вибачте, що я такий, зарозумілий, під маком,
вони не можуть зрозуміти, що я їбав чеські закони.
Чеська політика a. k. a. товсті фанатики,
заїбана суть усього цього світу,
я більше не хочу мати з цим нічого спільного, бачу, як блимають світлофори,
тому ми йдемо далі, нема чого чекати, бро.
Я їду у формації, як криптоніт, вибухаю, як динаміт,
ти почуваєшся супергероєм, хочеш нас, бро, зупинити,
ти джерело нашої їжі, засраний wannabe,
хейтер досі не підозрює, що його кар''єрний щабель закінчується,
ваші сфери, ваші розіграні сторони, про чистоту раси,
ваші маршрути, релігійне спасіння,
для мене заїбані балачки, я йду на сто відсотків до справи.

Ти не можеш іти, homie, далі, без цього ти справді не high,
ти й сам не знаєш, куди йти, тактика, власний план.
(2×)

Чеська республіка якраз для алкаша,
те, що ми тут живемо, — не надто велике везіння,
махінації, хабарі, оце гра нашого уряду,
швидко все подорожчати, де, бляха, нам на це брати.
Перші в бухлі, перші в наркоті, кожен крутить джоінт,
тут усе прогнило, в цьому вся суть,
я до цього вже звик, і мені вже на це байдуже,
будь певен, друже, що про якісний реп я подбаю,
реп — це моє життя, а воно ж коротке,
то вгорі, то внизу, ну, воно трохи мінливе,
це мій стиль, тож у цьому будь певен,
і мені справді байдуже, друже, що ти про мене думаєш,
у мене просто свій шлях, шлях обраний,
хоч мені й ясно, що багато хто цього не второпає,
я даю так, як даю, живу там, де живу,
нічого з цим не вдію, так, я вже сприймаю це так.

Ти не можеш іти, homie, далі, без цього ти справді не high,
ти й сам не знаєш, куди йти, тактика, власний план.
(2×)

Оце так, чувак, глянь, як живеться внизу,
хоч ненадовго увійди в мою роль,
у мене пітніють яйця від того, як мушу гарувати,
і мені погано від того, що я знаю, як мало за це отримаю.
Ви сидите на вухах у краватках, причепурені, напахчені, гаманці переповнені,
тисне вам у дупу, і вам усе мало,
я не сліпий, не дурний і не наймолодший,
але в мене є свій план, який мене врятує,
наш CD буде всюди легко дістати.
Ми покажемо тобі речі, яких ти досі не знав,
мені байдуже, що я роблю речі, які нелегальні,
заборонений плід тут усюди легко дістати,
і тому копи люблять ганяти через моє село,
мабуть, їм здається не зовсім нормальним,
що за те, що я роблю, я не плачу податків.

Плани й тактика мені нібито нічого не кажуть,
я дивуюсь, коли чую, що люди мені це закидають,
учора я робив те, що роблю сьогодні,
з ранку до вечора я тинявся біля «Теско»,
я мушу постійно бухати, все одно не хочу кидати,
живу й наживаюсь лише з подачок міста,
багато разів я мусив ночувати на тротуарі,
я соціальний злидар, від мене тхне розкладом,
я і моя банда займаємо позиції,
день у день ми хочемо грошей від усіх довкола,
я сідаю на землю з голодним псом,
ти бачиш лапу з капелюхом, обходиш мене десятою дорогою,
я сам напрошуюсь, у мене синець під оком,
я не зрушую з місця, я там, де був рік тому,
я лінивий покидьок, той ярлик не відмити,
мій план — усе життя орати бетон мордою.

Ти не можеш іти, homie, далі, без цього ти справді не high,
ти й сам не знаєш, куди йти, тактика, власний план.', 0
FROM `songs` s
WHERE s.`name` LIKE 'JML - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'JML - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Оце так, чувак' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Дивна планета', 'Тебе охоплює дивне відчуття, коли ти розплющуєш очі,
ми до цього доклали руку, не намагайтеся зняти з себе провину,
поводьмося так, як мають поводитися гості,
пізно будемо благати, коли тут лишаться руїни.
(2×)

Я плентаюся сам дорогою темною і довгою,
іду з похиленою головою, затьмареною, розгубленою,
повною думок, які так і не підуть,
лише люди йдуть, гарні спогади забирають із собою,
і при цьому забирають ціну, для мене нестерпну,
це фейк, як тату хною,
недовго вони є, а потім сміються,
що ж, на дивній планеті відбуваються дивні речі.
Я прямую в негоду, де всі дивляться на красу,
дівчата міряють стосунки довжиною членів,
куди подівся запал, раніше він був у кожного пана,
джентльмен на кожному розі відчиняв дамам двері, а сьогодні,
куди не глянь, хтось когось викрав,
це жах, нестяма, всюди вирубаний ліс,
на нашій планеті може процвітати лише промисловість,
і ця планета як клітка, з якої не втечеш,
війни, расизм, наркотики, вбивці,
так багато пасток, що збивають людей на коліна,
рикошетна куля, що вбила маленького хлопчика,
для родини це немислимі муки,
за кермом алкоголь, на вулицях наркота,
біля дороги безлад, куди котиться цей світ,
від того, що відбувається, у мене починає ставати розум,
бо я стою з вами на кораблі, що скоро зазнає краху.

І що це таке? І де я?
Це реальність чи лише дурний сон?
Може, я кретин, чи в тебе теж таке враження,
що наша земля мчить до загибелі просто перед носом?

Крок за кроком ти йдеш крізь життя,
ти б''єшся за своє місце під сонцем,
ти не хочеш бути рабом, ти боїшся за майбутнє,
але навряд чи можеш знати, що станеться за рогом,
поглянь, твої плани можуть швидко здохнути,
за мить усе інакше, ти навіть не встигнеш поворухнутися,
ця дивна планета замітає долі,
смерть прийде, як покидьок, і переріже тобі горло.
Людство не вчиться, ворожнеча править світом,
маленькі діти тиснуть пальцями на гачок кулемета,
цілу вічність ми бачимо це тут,
ми заплющуємо очі, просиджуємо цілі години в мережі,
ми працюємо, ми сприяємо розквіту,
ми, бляха, вбиваємо більшу частину часу,
ти чекаєш на ту дату, коли отримаєш зарплату,
ти дивуєшся, роботе, що не набив собі кишені.
Люди постійно поспішають, хоч і не знають куди,
життя повільно, але впевнено втрачає свій сенс,
життя та якість сьогодні міряються грошима,
що правда з любов''ю переможуть, уже ніхто не вірить,
немає місця для почуттів, ми будуємо кар''єри,
ми спустошуємо краєвид, ми ставимо бар''єри,
ми безоглядно викидаємо лайно в атмосферу,
чим же дихатимуть наші сини й доньки.
Я не намагаюся грати в Армію спасіння,
мене просто бісить, як людина рубає гілку, на якій сидить,
ігнорувати факти й проблему не вигідно,
не допоможуть навіть святі, все до нас повернеться.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Divná planeta%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Divná planeta%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Дивна планета' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Оце так, чувак', 'Оце так, чувак, глянь, як живеться внизу,
хоч ненадовго увійди в мою роль,
у мене пітніють яйця від того, як мушу гарувати,
і мені погано від того, що я знаю, як мало за це отримаю.
Ви сидите на вухах у краватках, причепурені, напахчені, гаманці переповнені,
тисне вам у дупу, і вам усе мало,
я не сліпий, не дурний і не наймолодший,
але в мене є свій план, який мене врятує,
наш CD буде всюди легко дістати.
Ми покажемо тобі речі, яких ти досі не знав,
мені байдуже, що я роблю речі, які нелегальні,
заборонений плід тут усюди легко дістати,
і тому копи люблять ганяти через моє село,
мабуть, їм здається не зовсім нормальним,
що за те, що я роблю, я не плачу податків.

Плани й тактика мені нібито нічого не кажуть,
я дивуюсь, коли чую, що люди мені це закидають,
учора я робив те, що роблю сьогодні,
з ранку до вечора я тинявся біля «Теско»,
я мушу постійно бухати, все одно не хочу кидати,
живу й наживаюсь лише з подачок міста,
багато разів я мусив ночувати на тротуарі,
я соціальний злидар, від мене тхне розкладом,
я і моя банда займаємо позиції,
день у день ми хочемо грошей від усіх довкола,
я сідаю на землю з голодним псом,
ти бачиш лапу з капелюхом, обходиш мене десятою дорогою,
я сам напрошуюсь, у мене синець під оком,
я не зрушую з місця, я там, де був рік тому,
я лінивий покидьок, той ярлик не відмити,
мій план — усе життя орати бетон мордою.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Skeli a Babar - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Skeli a Babar - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Оце так, чувак' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'uk', 'Звичайна людина', 'Кажуть, я маю усміхатися, йти разом зі стадом,
лізти людям у дупу, мабуть, навіть її витирати,
кажуть, я мав би вгамуватися й перестати так загострювати,
і змиритися з тим, як воно є, човгати ногами, похилити голову.
Цим не переймайся, цього не зрушиш, нічого не можеш зробити,
не думай, вимкни мозок, пахай, аж поки не розірветься тіло,
свою думку краще тримай при собі,
ти тут не для того, щоб змінити хід несприятливих речей.

Ти звичайна людина, твоя доля — колупатися в лайні,
усе життя сплачувати рахунок, дозволяти себе тягати,
твій потяг пішов уже в ту мить, коли ти побачив світ,
тож стули пельку, тримай крок і стань назад у стрій.
(2×)

Я малий покидьок, у мене майже півтора метра,
висовую голову з натовпу, мене хочуть посадити на палю,
я отримав тяжкі удари, в них мені сиплють сіль,
безліч ударів я ще отримаю,
вони летять з усіх боків, і я не роблю речі лише тому, що це було б cool,
у мене не ті самі захоплення, що в кожного другого бовдура,
за свою вдачу я постійно розплачуюсь по заслугах,
це халепа, що я успішно вибиваюсь із середнього,
ніхто не сміє бути нижче середнього чи вище середнього,
тримай свої мрії при собі, дивись, бляха, бери їх,
ти мусиш лише пахати, спати, пахати, спати, пахати, спати,
заробляти лайно, лайно одразу срати в унітаз, дякую, мені не цікаво
крокувати зі стадом, я справді не божевільний, я дотримуюсь свого плану,
свою думку краще тримай при собі,
я йтиму своїм шляхом, доки мені вистачить дихання.

Ти звичайна людина, твоя доля — колупатися в лайні,
усе життя сплачувати рахунок, дозволяти себе тягати,
твій потяг пішов уже в ту мить, коли ти побачив світ,
тож стули пельку, тримай крок і стань назад у стрій.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Obyčejnej člověk%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'uk')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Obyčejnej člověk%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Звичайна людина' WHERE l.`lang` = 'uk' AND (l.`title` IS NULL OR l.`title` = '');

-- vi
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', NULL, 'Tao muốn một viên đá quý, tao không muốn một con Pamela hư hỏng,
nhưng nếu nó muốn, tao có thể cho mày chút khói,
nó sẵn sàng dựng cho tao một kim tự tháp, tao đưa vào, rồi tao đi,
anh em tao đến, nhận lấy gậy tiếp sức, đừng giả vờ là mày chưa từng phê thuốc,
tao không tin mày một lời nào, mày lại dính đòn, trong mồm không chỉ một thằng,
mày lấy chuyện đó để tự quảng cáo, đừng giả vờ ngây thơ với tao,
RDM hay Zoom, rồi bọn tao gửi mày cho lũ chó tiếp theo, rồi bọn tao gửi mày cho lũ chó tiếp theo,
RDM hay Zoom, rồi bọn tao gửi mày cho lũ chó tiếp theo.

Nó ngậm hắn chỗ này rồi chỗ kia,
sủa vào chuồng chó, nó sẽ kéo mày xuống đáy,
bạn bè duy nhất của nó chỉ có trên OnlyFans,
nó chẳng còn giới hạn gì, trao thân cho tất cả.

Túi xách, giày xinh và một con xe mới,
sục cho một phát, thổi cho một phát, tiền đã kiếm xong,
cái nghề lâu đời nhất giờ đang nuôi mày,
ảnh của mày đã tràn ngập trên mạng.

Thân xác đang được lưu hành, cái đầu thì offline,
người ta buông tay ngay khi vừa biết mày,
giá trị bằng không, mày chẳng phải quý cô,
mẹ mày nói gì về cái chỗ ấy của mày?

Gửi lời chào đến bà ấy, vẫy bằng dildo,
mày hết sạch nhân cách, mày giải quyết bằng một chai bia,
ai cũng chỉ lấy của mày một mẩu nhỏ,
cơ sở dữ liệu sẽ không tự xóa đâu.

Mày chẳng quan tâm, miễn là mày kiếm được tiền,
easy money cho thân xác mình, nhân phẩm thì tạm biệt.
Mày chẳng quan tâm, miễn là mày kiếm được tiền,
easy money cho thân xác mình, nhân phẩm thì tạm biệt.

Con đĩ nghĩ nó có thể chơi tao, nhưng nó sẽ không làm được,
nó muốn tao ra lên người nó, nhưng tao bảo nó: cưng à, không, không, không, không,
tao sẽ chẳng bao giờ ở với loại như thế, tao đâu có điên, tao sẽ không bao giờ phản bội chính mình.
Tao muốn biết giá trị của tụi mày đã biến đi đâu,
nó biến mất khi tụi mày chạy theo đàn ông vì tiền,
vậy nên chữ "phụ nữ" chẳng có nghĩa gì với tụi mày,
và việc ăn mặc đẹp cũng chẳng có nghĩa gì cả.

Zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
zoom, zoom, zoom, zoom,
let''s go, zoom, zoom,
bật nó lên ở show và cho tất cả cùng nghe, cho loa nổ tung,
track này không sweet, không phải candy, thật sự không phải candy,
con nhỏ, mày im mồm đi, mày không có quyền nói, giờ là lúc lũ quỷ lên tiếng,
đứa kia thì tránh sang một bên và đợi tao đến tối,
con nhỏ đi phát weed, tưởng chẳng ai biết, tưởng sẽ giấu được,
người xung quanh nó kể với tao rồi, nó sẽ cho bất kỳ ai, nó sẽ thành một con bò ngu,
nhưng một ngày dung nham sẽ thiêu nó, còn tao sẽ nhảy tango và valse.

Nó là một con bò ngu và thích gây drama,
quỷ dữ, vội vàng, nó đang lướt trên sóng, người ta quay lưng,
nó gục ngã vì rượu, ai nó cũng chơi,
và lòng tự trọng đã biến mất, nó chẳng còn ngoan như trước.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Zoom - Drama%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Tích tắc', 'Có lẽ các người đã quên rồi, nhưng tôi vẫn còn đây,
chúng tôi vật lộn với cuộc đời, tự mở đường cho mình.
Tôi quét trước cửa nhà mình, không chen lên phía trước,
tôi nhìn từ xa xem lũ nhóc kẻ những đường bột.

Phê pha từ năm mười lăm tuổi, đời chắc là đỉnh lắm,
hít nó vào mũi, tự khóa mình trong lồng.
Tích tắc, tích tắc — cú big fuck đang đến gần,
cùng với nhận ra rằng não chỉ còn lại một đống bã.
Mày ngoái nhìn qua vai, cơn hoang tưởng đang giữ chặt mày.

Mày canh chừng lũ cớm, lỡ như chúng đến,
chúng sẽ lấy kratom của mày, cả đá nữa.
Chúng sẽ dốc hết mấy cái túi nhỏ đó ra,
mày muốn biến mất thật nhanh như Fittipaldi.
Tất cả đống của mày — thực tại là gì?
Cuộc đời mày, một thảm họa lớn, Mortal Kombat, fatality.
Chúng dẫn mày ra chiếc Octavia của chúng, trên tay mày cảm thấy còng,
trên đầu mày không thấy trời, dưới chân mày là dung nham.
Tôi đã thấy điều đó khi đi câu cá về,
mày cảm thấy nỗi sợ của mày, một chuyến trip điên rồ,
cơn sập đến, mày nếm mùi tồi tệ.

Mày muốn gây sự với tất cả, lỗi là ở cái nắm tay trống rỗng đó,
mày không biết khi nào phải nói dừng, mày không học được từ sai lầm của chính mình.
Mày có thể bắt đầu đào mồ cho mình, rồi sẽ chẳng còn sức nữa,
mong rằng mày sẽ không sốc khi không thể đảo ngược dòng chảy của mọi thứ.

Nó tự nghiền nát mày, nghiền, nghiền, tự nghiền nát,
nó lấy đi năng lượng của mày, lấy, lấy đi năng lượng.
Nó ăn mòn linh hồn mày, nó ăn mòn khuôn mặt mày,
gieo gì thì gặt nấy,
cái mặt mày trông như một tập tiêu bản lá khô,
mày đang vỡ vụn như một con nhân sư.

Mày muốn gây sự với tất cả,
lỗi là ở cái nắm tay trống rỗng đó,
mày không biết khi nào phải nói dừng,
mày không học được từ sai lầm của chính mình.
Mày có thể bắt đầu đào mồ cho mình,
rồi sẽ chẳng còn sức nữa,
mong rằng mày sẽ không sốc
khi không thể đảo ngược dòng chảy của mọi thứ.

Tích tắc, tích tắc, thời gian của mày sắp hết,
tích tắc, tích tắc, mày là một ca vô vọng,
tích tắc, tích tắc, cơn hoang tưởng không hồi kết.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tik Tak%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tik Tak%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tích tắc' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Nghìn mảnh vỡ', 'những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục

những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục
tôi đi tìm chính mình mà không biết bắt đầu từ đâu
tôi thiếu một mảnh của cơ quan vốn phải thúc tôi tiến lên
tôi không biết còn lại gì của tôi, liệu đó có còn là tôi
một thân xác không linh hồn và một linh hồn không thân xác
họ xé tôi thành nghìn mảnh rồi lại đi sang nhà khác

lại đi sang nhà khác

những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục

những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục

và giờ tôi tìm những dấu chân mà tôi từng bước qua
tôi không biết chuyện gì đã xảy ra khiến tôi quên hết tất cả
tôi đã vứt chiếc la bàn từng chỉ cho tôi đúng hướng
tôi để dòng nước cuốn mình đi như con thuyền không mái chèo
và thời gian trôi, tôi biết thời gian đã phí thì không cách nào lấy lại
những cánh cửa tôi từng mở giờ gần như đã khép
có lẽ tôi vẫn còn cơ hội thành công, có lẽ vẫn chưa mất hết

những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục

những bài hát vui vẻ giờ thật sự không ra nổi từ tôi
bị những mặc cảm gặm nhấm, tôi đã để mình bị hạ gục', 0
FROM `songs` s
WHERE s.`name` LIKE 'Tisíc kousků%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Tisíc kousků%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Nghìn mảnh vỡ' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Em phải ra đi', 'Em cảm thấy cái lạnh khi quỳ gối,
xung quanh chỉ có thời gian trôi, em chẳng còn chỗ dựa trong đó.
Em thấy mình cô đơn như giữa lòng hoang mạc,
em cảm nhận những ký ức mà em muốn đốt đi.

Em muốn quên đi mọi thứ đang kéo em xuống,
những chai rượu đã rơi khỏi bàn.
Em muốn quên đi tất cả những ngày
anh ta nói với em rằng sẽ biến mọi giấc mơ của em thành thật.

Em đã thấy an toàn trong mỗi vòng tay của anh ta,
giờ trái tim em đầy sẹo, bị cứa bởi toàn những lời dối trá.
Điều duy nhất khiến em muốn sống là đứa con em có với anh ta,
con bé là thứ duy nhất em còn quan tâm lúc này.

Em đã thôi cười từ lâu, em đã trải qua chuyện này cả trăm lần,
thôi nào, đừng ngây thơ — kẻ bạo hành đâu dễ thay đổi.
Em nhìn vào mắt con bé, trong khi nước mắt chảy từ mắt em,
không còn lựa chọn nào khác, em biết em phải ra đi.

Giờ em biết rồi.

Thật khó khăn biết bao,
phải một mình gánh mọi thứ.
Nghiến răng lại, đứng dậy và đừng sợ bước tiếp.
Em phải lại bắt đầu mơ về những ngày
khi em còn tràn đầy sức lực.
Quên đi bao nhiêu lần anh ta đánh em,
khi anh ta say khướt đến thế.
Thu dọn đồ đạc và biến đi,
em sẽ xoay xở được mà không có anh ta.
Con bé giờ là áo giáp của em,
là ý chí để em tiếp tục.
Em đã chịu đựng đủ rồi,
hai mẹ con sẽ cùng đốt cây cầu đó.

Ở lại — chạy đi — ở lại — ở lại —
em chẳng có nơi nào để đi — em sẽ tìm được đường —
anh ta sẽ thay đổi — em không còn tin điều đó nữa —
không có anh ta em không làm nổi — vì con bé, em phải làm!!!

Giờ em tự viết kịch bản cho mình,
anh ta không cần phải hành hạ em nữa,
thôi thì con bé sẽ lớn lên mà không có ông bố say xỉn.
Con bé sẽ hiểu rằng em không thể để mình bị đánh,
và cả việc hai mẹ con không bao giờ có thể quay lại với anh ta.

Giờ em mạnh mẽ hơn bao giờ hết,
cần có can đảm để chống lại anh ta, em chỉ tìm thấy nó khi có con bé.
Giờ mọi thứ sẽ tốt hơn, em đã giành lấy cơ hội của mình,
buổi sáng tiếp theo không còn làm em sợ, anh ta không còn ngủ bên cạnh em.
Chuyện đó đã vượt quá giới hạn, em đã bước qua nó,
em đã chịu đựng anh ta biết bao ngày,
em không đếm nổi bao nhiêu lần anh ta đấm em.

Giờ em biết rồi.

Bao nhiêu lần anh ta đấm em,
thôi nào, bao nhiêu lần anh ta đấm em,
anh ta đấm em.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Musíš odejít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Musíš odejít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Em phải ra đi' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Bọn mình chill', 'Khi bọn mình chill cùng nhau, trông bọn mình thông thái kinh khủng
Khi bọn mình chill cùng nhau, bọn mình lướt qua biển khói
Khi bọn mình chill cùng nhau, bầu không khí đặc dần lên
với mỗi mẩu tiếp theo trôi tuột xuống cổ họng

Khi bọn mình chill cùng nhau, trông bọn mình thông thái kinh khủng
Khi bọn mình chill cùng nhau, bọn mình lướt qua biển khói
Khi bọn mình chill cùng nhau, bầu không khí đặc dần lên
với mỗi mẩu tiếp theo trôi tuột xuống cổ họng

đó là một phù thủy quyền năng tên là weed, sau nó mọi thứ đều B.I.G
bọn mình là một đội như G.I. JOE, nên đừng căng, chỉ là một điếu JOINT
làm ơn đừng làm một thằng BOY ngốc, đừng căng, đừng căng, ĐỪNG CĂNG
bọn mình chẳng phải mối đe dọa, vì bọn mình hiểu nó như hiếm ai hiểu
bọn mình chill, chill suốt, chừng nào trong mồm còn một điếu đang ngủ gà ngủ gật
đầu điếu to như ngón tay cái, bọn mình rít như một con thú có vú thứ thiệt
giữ hơi như một tay sành sỏi, rồi đói như một con thú săn mồi
tôi chạy đi kiếm chút gì ăn rồi bọn mình lại WEED tiếp

những hơi rít, blunt, bong, bọn mình chiến trên mọi mặt trận
giấy cuốn trong túi, đầu lọc cho cái xô, điếu cuốn, indica, sativa, trồng trong nhà, trồng ngoài trời
máy nghiền xay nụ cho bọn mình, bọn mình xay, xay, xay một gram
ở nhà hay ngoài đường, với cả hội hay một mình, tôi rít một điếu to rồi cất tiếng hát

Khi bọn mình chill cùng nhau, trông bọn mình thông thái kinh khủng
Khi bọn mình chill cùng nhau, bọn mình lướt qua biển khói
Khi bọn mình chill cùng nhau, bầu không khí đặc dần lên
với mỗi mẩu tiếp theo trôi tuột xuống cổ họng

Khi bọn mình chill cùng nhau, trông bọn mình thông thái kinh khủng
Khi bọn mình chill cùng nhau, bọn mình lướt qua biển khói
Khi bọn mình chill cùng nhau, bầu không khí đặc dần lên
với mỗi mẩu tiếp theo trôi tuột xuống cổ họng

Bọn mình chẳng bao giờ thấy đủ, dừng lại à, đồ ngốc? bọn mình chẳng có lý do gì
bạn không biết cái trạng thái tuyệt đến thế, hòa bình và tình yêu, không giận dữ
bọn mình chill, chill suốt, lúc nào trong mồm cũng có một điếu đang ngủ gật
đầu điếu vẫn như ngón tay cái, bọn mình vẫn rít như thú có vú
vẫn giữ hơi như tay sành sỏi, bọn mình đã cuốn sẵn cả một bó
cơn thèm vẫn chưa nguôi, nên đưa đây thêm một điếu nữa', 0
FROM `songs` s
WHERE s.`name` LIKE 'Chillujem%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Chillujem%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Bọn mình chill' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Ổn cả', 'Và những lá bài đã được chia từ lâu
chúng ta vươn tay về những thứ sẽ nâng chúng ta lên
dù vô tình, ta như những thần dân
ta làm ra thành quả để họ đem bán thay ta

với ý nghĩ về mỗi ngày mai tốt đẹp hơn
dậy sớm từ tinh mơ, nào nhanh lên, lũ cừu, đi thôi
gặm nhấm qua guồng quay mỗi ngày
vì chút bố thí mà ta lột cả da mình
cứ để họ sống ổn, cứ để họ sống ổn, cứ để họ sống ổn

từ đỉnh kim tự tháp thế giới hẳn trông ổn lắm
nhưng còn những người còn lại phải đứng dưới bóng của nó thì sao
bạn đã hỏi họ chưa, liệu họ có ổn không,
liệu họ có ổn không, liệu họ có ổn không

hôm qua hắn đến bằng BMW, ngày mai hắn sắm xe hạng cao hơn, bạn biết đấy
trước nhà tôi là một chiếc xe cà tàng bắt đầu mục ruỗng
hóa đơn chồng chất, họ đã giở trò với phiếu lương
chút gì đó bỏ tủ lạnh, ví tôi trống rỗng

Và những lá bài đã được chia từ lâu
chúng ta vươn tay về những thứ sẽ nâng chúng ta lên
dù vô tình, ta như những thần dân
ta làm ra thành quả để họ đem bán thay ta

tôi nói đủ rồi !!!

tôi tự nắm lấy nó trong tay và sẽ đi con đường của mình
tôi chán làm lụng cho giấc mơ của người khác rồi
cho kỳ nghỉ chết tiệt của mày

vậy nên chúc mày sống ổn, tôi bắt được vibe và tôi đình công
padawan khao khát được nghe cơn hype
padawan muốn có thêm một lượt like
padawan sẽ trở thành bậc thầy và cái nghèo sẽ biến mất mãi mãi
giờ chỉ còn đôi tay sạch sẽ, cùng gã thợ ống nước biến đi chỗ khác hết đi
tôi muốn có được nhiều hơn là chỉ nhét ống bẩn vào mấy bức tường đó
tôi muốn có được nhiều hơn là chỉ nhét ống bẩn vào mấy bức tường đó', 0
FROM `songs` s
WHERE s.`name` LIKE 'Fajn%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Fajn%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ổn cả' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', NULL, 'Tôi còn chưa bay lên sân khấu, họ đã mong tôi chết đi,
mong tôi dập tắt nó, mong tôi vấp ngã, rằng tôi là thằng khốn chỉ biết làm ra rác,
còn chẳng được rác, hết kiểu sến súa, tôi dựa vào những beat này như cơn gió,
đừng chờ cứt chó, tôi mang đến một bản hit cộng, đi tìm em khác đi,
sau bản shit này nàng muốn được ở trên dick của tôi.

Vậy nên quen dần đi, tôi khởi động việc làm ăn, tôi có đòn bẩy để thay đổi đời mình,
chuyền nó đi tiếp, vươn lên cao hơn, một người làm lụng chân chính,
kiếm một triệu và sống tốt hơn, gieo top seed, đốt top weed,
bắt đầu sống cuộc đời, thôi sống lay lắt, thêm củi vào lò,
mặc kệ lũ khốn, áááá...

Thêm củi vào lò, mặc kệ lũ khốn, áááá...
Thêm củi vào lò, mặc kệ lũ khốn, áááá...
Thêm củi vào lò, mặc kệ lũ khốn, áááá...

Bao nhiêu nhiệt, bấy nhiêu hater!
Bấy nhiêu hater!', 0
FROM `songs` s
WHERE s.`name` LIKE 'Machine gun%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Ta phải sống', 'Dù có đau, ta vẫn phải bước tiếp,
thời gian chữa lành vết thương, bạn biết mà, ta phải sống.

Dù hôm qua tệ hại đến đâu,
hôm nay một ngày mới đang chờ tôi,
dù phía trước có là gì,
tôi không tin có điều gì là không thể.
Tôi không phải lúc nào cũng là kiểu người lạc quan,
thỉnh thoảng tôi cũng từng chạm đáy,
nhưng các người không dễ gì thoát khỏi tôi đâu,
tôi giống như Sauron vậy.
Dù không có tiền, ở trường thì tệ hại vô cùng,
đúng là tôi lúc nào cũng đi làm,
nhưng tôi còn chưa đến gần được những đồng tiền lớn,
nên tôi sẽ không bao giờ bỏ cuộc trong đời,
tôi sẽ cày cho đến khi
tôi trở thành một ngôi sao,
tôi muốn bay trên bầu trời,
nhưng không thuộc về không quân.
Boom, đây chính là âm thanh của việc tôi theo đuổi nó,
tôi thật sự đang làm một điều gì đó,
trong khi bạn chỉ viết nó lên Facebook,
tôi chẳng nhận được gì từ bố,
tôi muốn trả lại mọi thứ cho mẹ,
chẳng có gì tự rơi vào lòng bạn,
bạn phải sẵn sàng đi xa hơn, kể cả vì mục tiêu của mình.
Bạn ơi, tôi biết rất rõ điều đó nghĩa là gì,
sống trong nghèo khó, như bị mắc vào lưới,
bạn thấy như mọi thứ đang đi tong,
nhưng câu chuyện là ở chỗ đó,
đừng hư hỏng như một đứa trẻ.

Dù có đau, ta vẫn phải bước tiếp (phải bước tiếp),
thời gian chữa lành vết thương, bạn biết mà, ta phải sống (phải sống).
Dù có đau, ta vẫn phải bước tiếp (phải bước tiếp),
thời gian chữa lành vết thương, bạn biết mà, ta phải sống (phải sống).

Tôi đã thất bại và thua cuộc rất nhiều lần,
nhưng tôi chưa bao giờ hỏi tại sao lại là tôi,
tôi chỉ đứng dậy và đi tiếp,
tôi rất muốn thắng mọi trận đấu
và ăn mừng như người Đan Mạch, nhưng khi đó tôi sẽ không bao giờ
có được sự khiêm nhường như bây giờ.
Đi qua địa ngục còn tốt hơn
là có mọi thứ ngay trước mũi
và sống chỉ như một gã hề hời hợt hay một thằng khốn
chẳng biết gì về cuộc đời,
tiếng cười, đúng hơn là đáng khóc,
vì không có nỗi đau bạn sẽ không biết hạnh phúc là gì.
Và tôi đã ngã sấp mặt nhiều lần đến mức
tôi chẳng buồn đếm nữa,
và tôi nghĩ nhiều hơn về việc mình sẽ cho bao nhiêu
hơn là việc mình nên nhận bao nhiêu,
tôi biết chuyền bóng thì tốt hơn
là làm hỏng mọi thứ và chẳng thắng được gì.
Và thế là tôi vẫn đứng vững hai chân trên mặt đất
và cố gắng vì điều đó,
để một ngày tôi được sống mọi giấc mơ mình từng có,
thế giới đôi khi thật phức tạp,
chính tôi cũng không hiểu nổi nó,
và tôi cũng giống như các bạn,
không ai trong các bạn đơn độc cả.

Dù có đau, ta vẫn phải bước tiếp (phải bước tiếp),
thời gian chữa lành vết thương, bạn biết mà, ta phải sống (phải sống).
Dù có đau, ta vẫn phải bước tiếp (phải bước tiếp),
thời gian chữa lành vết thương, bạn biết mà, ta phải sống (phải sống).', 0
FROM `songs` s
WHERE s.`name` LIKE 'Refew - Musíme žít%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Refew - Musíme žít%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Ta phải sống' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Tôi không hiểu', 'Tôi không hiểu cái ác trong ta từ đâu mà ra
Tôi không hiểu sao nó cứ mãi giằng xé trong ta
Tôi không hiểu cái ác trong ta từ đâu mà ra
Cái ác trong ta từ đâu mà ra
Sao nó cứ mãi giằng xé trong ta

Ta yêu nhau, ngồi cạnh nhau lại khiến cả hai dằn vặt
Ta nuôi nhau bằng mật, mà trong mật có thuốc độc
Và suốt x năm ấy với câu hỏi liệu đây có phải lần cuối
Ta nói lời chia tay, ta luôn bị thử thách
Ta luôn cố gắng để thuộc về nhau
Để nhường nhịn nhau và không nói thêm gì
Ngoài những điều thật sự cần thiết
Nhưng không thể như vậy được, nhưng không thể như vậy được
Không thể như vậy được, ở bên nhau chỉ vì thói quen
Thật sự không được, tôi với tay lên tay nắm cửa
Tôi muốn biến mất, tôi gọi mayday, quanh ta là tấm lưới
Được dệt từ những ký ức và những nơi chốn ấy
Ta đã biết nó không còn như trước nữa
Giờ nó chỉ còn kẽo kẹt, nhưng trên những chiếc giường khác

Và sáng ra như chẳng có gì, sáng ra như chẳng có gì
Và sáng ra như chẳng có gì, sáng ra như chẳng có gì

Ảo tưởng giả dối, những lời nói dối thật lòng
Bên bữa sáng ta nhắc về những ngày ta từng là một đội
Ta đã sống với ý nghĩ rằng tôi là Caesar còn cô ấy là thành Rome của tôi
Ảo tưởng giả dối, những lời nói dối thật lòng
Bên bữa sáng ta nhắc về những ngày ta từng là một đội
Ta đã sống với ý nghĩ rằng tôi là Caesar còn cô ấy là thành Rome của tôi

Và vì thế tôi không hiểu cái ác trong ta từ đâu mà ra
Tôi không hiểu sao nó cứ mãi giằng xé trong ta
Tôi không hiểu cái ác trong ta từ đâu mà ra
Cái ác trong ta từ đâu mà ra
Sao nó cứ mãi giằng xé trong ta

Nhưng với ta như thế vẫn là chưa đủ
Và từ lâu ta chẳng tìm được lý do để kéo dài thêm
Ta vẫn còn những ký ức xa xưa
Sợi dây vài năm ấy là thứ giờ đây còn ràng buộc ta với nhau
Ta có thêm một vết khắc, em đi tìm những gương mặt mới
Em lại bắt đầu tỏa sáng, lần đầu tiên tôi không thấy ghen
Vậy thì biến đi, thu dọn hết đồ đạc của em
Từ lâu tôi đã chấp nhận rằng mình đơn độc trên đường đua
Chính em đã cho tôi ý tưởng, kẻ nói dối ở cả hai phía
ta biết rõ ý định, chẳng ai còn muốn cứu vãn mối tình xưa
Từng đẹp đến thế, từ khi nào nó trở nên trống rỗng
Những ngày ấy sẽ không quay lại, em là gánh nặng với tôi
Vậy đừng chần chừ nữa, giờ em có thể đi rồi..

Cả hai ta sẽ thấy tốt hơn
 và giờ em có thể đi rồi..
Cả hai ta sẽ thấy tốt hơn
 và giờ em có thể đi rồi..
Cả hai ta sẽ thấy tốt hơn', 0
FROM `songs` s
WHERE s.`name` LIKE 'Nechápu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Nechápu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tôi không hiểu' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Đi đi', 'Tôi thấy những giấc mơ tuổi thơ, tôi nghe những giọng nói từng bảo "đi đi",
chúng giảng giải cho tôi cách chuẩn bị để chịu đựng những ngày ấy,
và thế là tôi đi, một câu chuyện made in hell, vì giấc mơ đó tôi đã cày cuốc.
Qua những đường cống, năm tháng cứ trôi, tôi tự nhủ cả trăm lần, tôi không được để nó xảy ra nữa, không được để nó xảy ra nữa,
bước trên dấu chân của chính mình và làm được bất cứ điều gì, thẳng lưng như những hàng dương,
dù trẻ hay đã chống gậy,
mỗi chúng ta đều biết giá trị của mình, mỗi chúng ta đều là một nguyên mẫu,
vì thế tôi muốn xin một chút khiêm nhường.
Mỗi chúng ta đều có những giấc mơ chưa thành,
ta mơ về chúng mỗi đêm, ta theo đuổi chúng suốt ngày dài,
mỗi gương mặt đều biết khi nước mắt lăn dài trên đó,
khi vận rủi và cơ hội lại bắt tay nhau.

Tôi thấy những giấc mơ tuổi thơ, tôi nghe những giọng nói bảo "đi đi".
Tôi thấy những giấc mơ tuổi thơ, tôi nghe những giọng nói bảo "đi đi".', 0
FROM `songs` s
WHERE s.`name` LIKE '%Jdi%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Jdi%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Đi đi' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Chúa Hài Đồng ơi', 'Chúa Hài Đồng ơi, Ngài mang cho con món quà đẹp gì thế,
Chúa Hài Đồng ơi, bỏ cho con cái đằng kia vào túi nhỏ,
Chúa Hài Đồng ơi, cái này sẽ làm con phê ngất ngư,
Chúa Hài Đồng ơi, mang thêm cho con một thùng mười hai lon bia.

Ngày hai mươi bốn tháng mười hai, chẳng gì tuyệt hơn là được phê,
con không biết nên đi đâu, không biết chuyện gì sẽ tới, nên con cứ rít weed, thử uống chút đỉnh,
để hiểu rõ hơn phép màu Giáng sinh,
con cá chép trong bồn tắm nhìn chằm chằm vào con, con bảo nó "hòa bình",
chỉ một cú vào gáy là con sẽ giải thích cho nó mọi chuyện,
tiếc là trước đó con đánh trượt tới sáu lần.
Những bài thánh ca quanh chiếc radio vang lên, lại đến lúc tốt để say bí tỉ,
lăn lộn trên sàn, những ly rượu, lại đây với con,
con tăng không khí Giáng sinh bằng thuốc, con quý hàng xóm, họ mang cho con cành tầm gửi,
cảm ơn, tạm biệt, Giáng sinh vui vẻ,
con phấn khích lắm, cành tầm gửi bay vào sọt rác còn con bay theo điếu weed.

Chúa Hài Đồng ơi, Ngài mang cho con món quà đẹp gì thế,
Chúa Hài Đồng ơi, bỏ cho con cái đằng kia vào túi nhỏ,
Chúa Hài Đồng ơi, cái này sẽ làm con phê ngất ngư,
Chúa Hài Đồng ơi, mang thêm cho con một thùng mười hai lon bia.

Chúa Hài Đồng ỉa dưới cây thông của con, viết lên mảnh giấy rằng con là đồ khốn,
rằng con hút cỏ và nhậu nhẹt, tiệc tùng và chơi gái, ở nhà lười biếng và tự sướng.
Con thì bla bla, cứ để Ngài lải nhải, con là đồ ngốc, haha, cỏ muôn năm,
hiếm ai bị Chúa Hài Đồng mắng mỏ, tinh thần con chịu không nổi,
nên con tu một hơi, mắt chảy ra dung nham, con lao vào bánh quy Giáng sinh,
nhiều rượu rum đến mức con chẳng nhớ gì cả, không có cơ hội nào
giữ được mọi thứ trong bụng, con nôn ra cả mét.
Sáng hôm sau con nhặt mình lên khỏi sàn, đôi chân ơi, đưa con thẳng lên giường,
hôm nay không được đâu, hôm nay để con yên,
tối qua Chúa Hài Đồng đã cực kỳ ác với con.

Chúa Hài Đồng ơi, Ngài mang cho con món quà đẹp gì thế,
Chúa Hài Đồng ơi, bỏ cho con cái đằng kia vào túi nhỏ,
Chúa Hài Đồng ơi, cái này sẽ làm con phê ngất ngư,
Chúa Hài Đồng ơi, mang thêm cho con một thùng mười hai lon bia.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ježíšku panáčku%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Ježíšku panáčku%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Chúa Hài Đồng ơi' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Giờ tôi đã biết', 'Tôi ước mình biết bay, như cánh chim bay,
chỉ cần vỗ cánh, vẫy tay tạm biệt,
từ trên cao mặc kệ hết thảy, chẳng để bụng điều gì nữa
và với chút hy vọng còn sót lại, bay đi đâu đó xa hơn,

Tôi ước mình biết bay, như cánh chim bay,
chỉ cần vỗ cánh, vẫy tay tạm biệt,
từ trên cao mặc kệ hết thảy, chẳng để bụng điều gì nữa
và với chút hy vọng còn sót lại, bay đi đâu đó xa hơn,

đến một nơi
không có kiêu ngạo, không có dối lừa ngu ngốc,
và con người không chỉ biết đưa đây, đưa đây.
Thần kinh tôi phải cứng hơn cả thép xe tăng,
tôi nhìn mọi thứ từ trên cao, như thể tôi đang đứng
trên đỉnh Mont Blanc.
Âm dương từ lâu đã chẳng còn đúng nữa,
mọi điều tốt tôi làm đều hóa thành điều xấu,
số phận trả đũa tôi tất cả, tôi trả giá không ngừng,
nhưng sẽ đến lúc tôi lật ngược lá bài ấy.

Giờ tôi đã biết, điều đã xảy ra là điều phải xảy ra,
tất cả là số phận, chẳng đáng để chống lại nó, chết tiệt.
Giờ tôi đã biết, đôi khi nó khó hơn ta tưởng,
những gì số phận đôi khi bày ra cho ta thật sự kinh tởm.

Cuộc đời đá đít tôi, thật sự hết cỡ,
mọi ngóc ngách đời mình tôi đã ghé qua cả rồi,
tôi đã dọn hết mọi đống rác mà ai đó để lại cho tôi,
thứ gì tôi chạm vào, tôi cũng đều làm hỏng.

Những giấc mơ hóa thành tro bụi, trong mắt tôi chỉ còn nỗi sợ,
rồi chuyện gì sẽ đến, tôi chờ cú sụp đổ tiếp theo,
cái gì lại hỏng nữa, ai lại chơi xấu tôi nữa,
giữa chúng ta có những kẻ sẵn sàng đâm dao vào lưng tôi.

Giờ tôi đã biết, điều đã xảy ra là điều phải xảy ra,
tất cả là số phận, chẳng đáng để chống lại nó, chết tiệt.
Giờ tôi đã biết, đôi khi nó khó hơn ta tưởng,
những gì số phận đôi khi bày ra cho ta thật sự kinh tởm.

Phản bội, đau đớn,
một kết cục tồi,
thành phố hay làng quê,
toàn lũ ngốc, lũ ích kỷ,
chúng muốn thấy tôi bốc cháy,
chúng muốn thấy tôi gục ngã,
vậy thì liếm đi, thằng kia.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Já už vím'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Já už vím' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Giờ tôi đã biết' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Tận cuối hàng', 'Bạn có thể van xin, có thể quỳ gối, có thể khóc mãi,
chẳng ai quan tâm, mọi thứ bạn phải tự gánh lấy.
Mọi vấn đề lướt qua trước mắt bạn trong chớp mắt,
nhưng ai cũng phải bước trên con đường đầy gai của riêng mình.
(4×)

Bạn chìm trong nợ nần, chẳng có dấu hiệu khá lên,
mười hai tiếng liền ở chỗ làm, những công dân khốn khổ,
chẳng có thời gian cho con cái, phải cày, ngủ, sáng dậy,
hết lần này đến lần khác làm thêm giờ chỉ để tạm đủ sống.
Bạn đã trải qua quá nhiều đến mức chẳng gì làm bạn ngạc nhiên nữa,
bất ngờ phải ký giấy thôi việc ở chỗ làm,
công việc đẩy bạn đến mức thú nhận rằng bạn sợ vãi ra quần khi biết mức lương trợ cấp,
mà với nó bạn phải trả các hóa đơn.
Chỉ còn đôi mắt để khóc, đến một xu lẻ cũng chẳng còn,
chỉ còn thêm một kẻ ăn xin chẳng đi được xa,
vậy mà mỗi sáng tiếp theo một con cừu ngoan ngoãn lại nhập vào đàn,
người vì miếng ăn, người vì thuốc đá,
để người ta lột cả da mình.
Một đống giai đoạn, giấc mơ tan biến thế nào, đâu đó xa xa những cây ước nguyện cứ bị đốn hạ,
dù bạn có chống cự, dù bạn tưởng mình đang bắt kịp,
một bước ngoặt có thể đến, và khi đó làm sao đứng dậy với cảm giác chẳng còn gì đáng để đứng lên.
Mọi thứ từng ổn, giờ thì uống thuốc trong bộ áo trắng, tận cuối hàng,
dần dần yếu đi, dần dần với lấy thứ có vẻ đúng vào khoảnh khắc ấy,
đồ ăn cắp đổi lấy ma túy và rượu, gia đình bị gạt sang bên, ở anh ta toát ra nỗi sợ,
anh ta không còn là gã đàn ông ấy nữa, tiếc là anh ta đã buông xuôi,
quá sức thật rồi, người ta tìm thấy anh ta trên một cái cây đêm qua,
trên giấy anh ta viết bài văn cuối cùng, và ở cuối, rằng anh ta đã làm những gì có thể.

Bạn có thể van xin, có thể quỳ gối, có thể khóc mãi,
chẳng ai quan tâm, mọi thứ bạn phải tự gánh lấy.
Mọi vấn đề lướt qua trước mắt bạn trong chớp mắt,
nhưng ai cũng phải bước trên con đường đầy gai của riêng mình.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%vzadu%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%vzadu%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Tận cuối hàng' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', NULL, 'Solo, anh muốn được solo với em,
em và anh, chỉ hai ta, suốt đêm và quanh ta chỉ có bóng tối.
Solo, anh muốn được solo với em.

Ta biến mất, trong mắt là dục vọng, đừng mong sến súa, anh là tay chăm chỉ hàng đầu, em là hàng đầu, em biết mà,
anh muốn cởi đồ em, anh muốn có em, đưa em về nhà với anh.
Thật điên rồ khi em ngày càng nhiều hơn, ta ngày càng gần hơn, anh nhắm ngày càng thấp hơn, bay ngày càng cao hơn,
cô gái đáng để trưng bày, hình xăm khắp nơi, khuyên, trang sức, không như mấy con ngựa già kia, sexy tuyệt đối,
chỉ là giờ anh không muốn, anh muốn dạy em một bài học cho cuộc đời em,
làm tốt hơn, làm lâu hơn những kẻ đã làm trước đó,
chỉ một ánh nhìn là anh biết phải làm gì với cơ thể hoàn hảo ấy,
gây nghiện như thuốc đá, trong không khí anh cảm thấy endorphin.

Solo, anh muốn được solo với em,
em và anh, chỉ hai ta, suốt đêm và quanh ta chỉ có bóng tối.
Solo, anh muốn được solo với em, ta vào hiệp hai duyên dáng như Zorro,
biến thái, và anh suýt nữa gầm lên "toro" với em, đúng là cô gái, ngoan ngoãn nghe lời,
em làm vậy vì chính mình, em kêu ré lên như sáo, em chơi đùa với con rắn hổ mang của anh, cho anh vào giữa hai đùi em,
anh muốn chơi với chỗ ấy của em, và thật lâu, cho nó biết thế nào là lễ độ, anh muốn sex, đó là phương châm của anh,
từ khi mọi chuyện đến mức anh nhận ra điều tốt trong anh đã chết,
bài diễn văn thì gửi qua bưu điện.

Giờ em solo, anh muốn được solo với em,
em và anh, chỉ hai ta, suốt đêm và quanh ta chỉ có bóng tối.
Solo, anh muốn được solo với em,
em và anh, chỉ hai ta, suốt đêm và quanh ta chỉ có bóng tối.

Solo, anh muốn được solo với em, trong bồn tắm chơi bóng nước,
lụt rồi, nhưng thì sao, anh không cưỡng lại được, thèm một cú lặn thật sâu,
trận chiến Medal of Honor, một bác sĩ có bằng cấp,
anh biết những điểm yếu của em: tai, bụng, bẹn,
đừng ngừng chuyển động, anh thích ngắm nhìn,
anh là ca vô phương cứu chữa, giường phải kêu cót két,
lông vũ sẽ bay, sâm panh phải phun trào,
nàng không cưỡng lại được, phải cắn, cào, rên rỉ,
anh không dừng được, cứ tưởng tượng những cử chỉ của nàng,
ngôi sao phim người lớn số một, muốn bị trừng phạt, một trong một trăm,
señora trong mơ, đẳng cấp Lexus, nên đừng làm phiền bọn anh, anh xin nghỉ phép và mang theo người phụ nữ này.

Giờ em solo, anh muốn được solo với em,
em và anh, chỉ hai ta, suốt đêm, nhưng cả hai vẫn mãi độc thân.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Solo%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', NULL, 'Mọi chuyện bắt đầu thật ngây thơ, một lần như thế sau chút rượu vang,
bọn mình ngồi, bọn mình la cà, chẳng biết gì về thế giới,
mới mười lăm tuổi, thôi thì, những cậu nhóc ngây ngô,
chúng cuốn điếu thuốc xanh đầu tiên của mình,
cảm giác chao đảo kéo đến khi bạn châm điếu ấy,
với niềm thèm khát cuộc sống tôi lao vào vòng xoáy khám phá,
trong miệng tôi đến nước bọt cũng chẳng còn, tôi tan biến trong làn khói này,
thôi thì, cái cây này, từ đó đến giờ cứ mỗi tiếng.
Đồ ăn thức uống ngon hơn, công việc cũng dễ sống sót hơn,
cả ngày đều vui vẻ, vậy nên đừng làm như mình nhút nhát,
ngồi vào vòng tròn đi, đừng ngốc nghếch, đời chỉ có một, nên hãy tận hưởng nó cho ra trò.

Đó là ganja, một phù thủy quyền năng tên là ganja,
vị cứu tinh và liều thuốc cho nỗi buồn và cơn giận,
hiếm ai hiểu được, con người không sẵn lòng sống một cuộc đời tự do.
(2×)

Sáng ra, vừa ngủ dậy, tôi cuốn ngay nửa gram,
nửa gram kia tôi để dành cho chương trình lát nữa,
khắp nơi là lệnh cấm, cây cỏ bất hợp pháp, nhưng chẳng ngăn được tôi
đi tìm những chỗ lý tưởng để chui vào và để những nụ hoa tuyệt vời quyến rũ mình,
giờ chỉ còn việc cuốn, nằm ngả lưng ra,
tận hưởng những trạng thái hoàn hảo, không làm lụng, không cực nhọc.
Yeah, đó là điều tôi thích, thế mới vui, gửi lời chào đến mọi người bạn cũng làm như vậy,
bọn mình bị mê hoặc bởi một bùa chú hòa bình đầy quyền năng,
chẳng thể so sánh nó với rượu được.

Đó là ganja, một phù thủy quyền năng tên là ganja,
vị cứu tinh và liều thuốc cho nỗi buồn và cơn giận,
hiếm ai hiểu được, con người không sẵn lòng sống một cuộc đời tự do.
(3×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Ganja%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Trời đất ơi', 'Trời đất ơi, trời đất ơi,
vậy thì hiểu đi, tao chơi hết một trăm phần trăm,
năm này qua năm khác tao đéo quan tâm tất cả, đéo quan tâm mày, đéo quan tâm tất cả thời buổi này,
xin lỗi vì tao như thế này, kiêu ngạo, phê thuốc phiện,
chúng nó không thể hiểu nổi rằng tao đéo quan tâm luật pháp Séc.
Chính trị Séc a. k. a. lũ cuồng tín béo phì,
cái điểm mấu chốt chết tiệt của cả thế giới này,
tao chẳng muốn dính dáng gì đến nó nữa, tao thấy đèn giao thông nhấp nháy,
vậy nên bọn tao tiếp tục, chẳng có gì phải chờ, người anh em.
Tao đi theo đội hình như kryptonite, tao nổ tung như thuốc nổ,
mày thấy mình như siêu anh hùng, mày muốn chặn bọn tao lại, người anh em,
mày là nguồn thức ăn của bọn tao, một thằng wannabe vớ vẩn,
kẻ ghét vẫn chưa biết rằng nấc thang sự nghiệp của hắn sắp kết thúc,
những lĩnh vực của tụi mày, những phe đang chơi dở của tụi mày, về sự thuần khiết chủng tộc,
những lộ trình của tụi mày, sự cứu rỗi tôn giáo,
với tao toàn là lời nhảm chết tiệt, tao đi thẳng vào vấn đề một trăm phần trăm.

Mày không thể đi tiếp đâu, homie, thiếu nó mày thật sự chẳng high,
chính mày cũng chẳng biết đi đâu, chiến thuật, kế hoạch riêng.
(2×)

Cộng hòa Séc, hợp ngay cho dân nghiện rượu,
việc bọn tao sống ở đây chẳng phải là may mắn gì lớn,
lừa đảo, hối lộ, đó là trò chơi của chính phủ,
tăng giá mọi thứ thật nhanh, mẹ kiếp, bọn tao lấy tiền đâu ra.
Nhất về nhậu, nhất về ma túy, ai cũng cuốn một điếu,
ở đây mục ruỗng cả rồi, đó là toàn bộ vấn đề,
tao đã quen với nó rồi, và tao chẳng thèm bận tâm nữa,
cứ yên tâm đi, anh bạn, tao sẽ lo cho rap chất lượng,
rap là cuộc đời tao, mà đời thì ngắn ngủi,
lúc lên, lúc xuống, ừ, nó hơi thất thường,
đây là phong cách của tao, nên cứ yên tâm về điều đó,
và tao thật sự chẳng quan tâm, anh bạn, mày nghĩ gì về tao,
tao đơn giản có con đường của mình, con đường được chọn,
dù tao biết rõ nhiều người sẽ không hiểu nổi,
tao chơi theo cách tao chơi, tao sống nơi tao sống,
tao chẳng làm gì được với nó, yeah, tao chấp nhận nó như thế.

Mày không thể đi tiếp đâu, homie, thiếu nó mày thật sự chẳng high,
chính mày cũng chẳng biết đi đâu, chiến thuật, kế hoạch riêng.
(2×)

Trời đất ơi, nhìn xem dưới đáy người ta sống thế nào,
ít nhất hãy thử đặt mình vào vai tao một lúc,
bi tao toát mồ hôi vì phải cày cuốc,
và tao phát ốm khi biết mình sẽ nhận được bao ít cho chuyện đó.
Tụi mày ngồi trên tai mình trong cà vạt, chải chuốt, thơm tho, ví căng phồng,
nó đè vào đít tụi mày mà tụi mày vẫn chưa thấy đủ,
tao không mù, không ngu, cũng chẳng phải trẻ nhất,
nhưng tao có kế hoạch của mình, nó sẽ cứu tao,
CD của bọn tao sẽ dễ kiếm ở khắp nơi.
Bọn tao sẽ cho mày thấy những thứ đến giờ mày chưa từng biết,
tao chẳng bận tâm việc tao làm những thứ không hợp pháp,
trái cấm ở đây đâu cũng dễ kiếm,
và vì thế lũ cớm thích phóng qua làng tao,
chắc chúng thấy không bình thường lắm
khi tao chẳng nộp thuế cho những gì tao làm.

Kế hoạch và chiến thuật nghe nói chẳng có nghĩa gì với tao,
tao ngạc nhiên khi nghe người ta trách tao vì điều đó,
hôm qua tao làm đúng những gì hôm nay tao làm,
từ sáng đến tối tao lảng vảng ở Tesco,
tao lúc nào cũng phải nhậu, dù sao tao cũng chẳng muốn dừng,
tao sống và kiếm lời chỉ từ đồ bố thí của thành phố,
nhiều lần tao phải ngủ trên vỉa hè,
tao là đồ ăn bám trợ cấp, người tao bốc mùi mục rữa,
tao và băng của tao chiếm lấy vị trí,
ngày qua ngày bọn tao đòi tiền của mọi người xung quanh,
tao ngồi xuống đất với một con chó đói,
mày thấy một cái chân với chiếc mũ, mày đi vòng thật xa tránh tao,
tao tự chuốc lấy, tao bị bầm một bên mắt,
tao chẳng nhúc nhích khỏi chỗ, tao vẫn ở đúng nơi tao ở năm ngoái,
tao là đồ cặn bã lười biếng, cái nhãn đó không rửa sạch được,
kế hoạch của tao là cả đời cày bê tông bằng mặt.

Mày không thể đi tiếp đâu, homie, thiếu nó mày thật sự chẳng high,
chính mày cũng chẳng biết đi đâu, chiến thuật, kế hoạch riêng.', 0
FROM `songs` s
WHERE s.`name` LIKE 'JML - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'JML - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Trời đất ơi' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Hành tinh kỳ lạ', 'Một cảm giác kỳ lạ xâm chiếm bạn khi bạn mở mắt,
chúng ta đều nhúng tay vào, đừng cố chối bỏ tội lỗi,
hãy cư xử như những vị khách nên cư xử,
ta sẽ van xin quá muộn, khi nơi đây chỉ còn đống đổ nát.
(2×)

Tôi lê bước một mình trên con đường tối tăm và dài dằng dặc,
tôi bước đi với cái đầu cúi gằm, u ám, rối bời,
đầy những suy nghĩ cứ mãi không chịu rời đi,
chỉ có con người rời đi, họ mang theo những ký ức đẹp,
và cùng lúc đó họ mang theo một cái giá mà tôi không chịu nổi,
nó giả tạo như hình xăm bằng henna,
họ ở đây một lúc rồi họ cười,
thôi thì, trên hành tinh kỳ lạ, những điều kỳ lạ xảy ra.
Tôi hướng vào thời tiết xấu, nơi ai cũng chỉ nhìn vào vẻ đẹp,
các cô gái đo một mối quan hệ bằng độ dài của dương vật,
nhiệt huyết đã đi đâu mất, ngày xưa quý ông nào cũng có,
ở mỗi góc phố quý ông mở cửa cho các quý bà, còn hôm nay,
nhìn đâu cũng thấy có kẻ bắt cóc ai đó,
thật kinh hoàng, điên loạn, khắp nơi rừng bị chặt trụi,
trên hành tinh của chúng ta chỉ có công nghiệp được nở hoa,
và hành tinh này như một cái lồng mà bạn không thể thoát ra,
chiến tranh, phân biệt chủng tộc, ma túy, kẻ sát nhân,
bao nhiêu cạm bẫy khiến con người quỵ gối,
một viên đạn lạc đã giết một cậu bé,
với gia đình đó là nỗi đau không thể tưởng tượng,
sau tay lái là rượu, trên đường phố là ma túy,
bên đường là rác rưởi, thế giới này đang đi về đâu,
trước những gì đang xảy ra, đầu óc tôi bắt đầu đứng hình,
vì tôi đang đứng cùng các bạn trên con tàu sắp đắm.

Đây là gì? Và tôi đang ở đâu?
Đây là thực tại hay chỉ là một giấc mơ ngớ ngẩn?
Tôi là thằng ngốc chăng, hay bạn cũng có cảm giác ấy,
rằng đất nước ta đang lao về diệt vong ngay trước mũi mình?

Từng bước một bạn đi qua cuộc đời,
bạn tranh giành chỗ đứng của mình dưới mặt trời,
bạn không muốn làm nô lệ, bạn lo lắng cho tương lai,
nhưng bạn khó mà biết điều gì sẽ xảy ra ở khúc quanh,
nhìn xem, kế hoạch của bạn có thể chết yểu rất nhanh,
trong khoảnh khắc mọi thứ đã khác, bạn còn chẳng kịp nhúc nhích,
hành tinh kỳ lạ này quét đi những số phận,
cái chết đến như một thằng khốn và cứa cổ bạn.
Nhân loại không biết rút ra bài học, thù hận thống trị thế giới,
những đứa trẻ nhỏ đặt ngón tay lên cò súng máy,
cả một thời gian dài vô tận ta đã thấy điều đó ở đây,
ta nhắm mắt lại, ta ngồi cả giờ liền trên mạng,
ta làm việc, ta góp phần vào sự thịnh vượng,
ta giết chết phần lớn thời gian của mình một cách khốn nạn,
bạn ngóng chờ cái ngày lĩnh lương,
bạn ngạc nhiên, hỡi người máy, rằng mình chẳng nhét đầy được túi.
Con người lúc nào cũng vội vã, dù chẳng biết đi đâu,
cuộc sống chậm rãi nhưng chắc chắn đang mất đi ý nghĩa,
cuộc sống và chất lượng ngày nay được đo bằng tiền,
rằng sự thật và tình yêu sẽ chiến thắng, chẳng ai còn tin nữa,
không còn chỗ cho cảm xúc, ta xây dựng sự nghiệp,
ta tàn phá cảnh quan, ta dựng lên những rào cản,
ta vô tư xả rác rưởi vào bầu khí quyển,
không biết con trai con gái ta rồi sẽ thở bằng gì.
Tôi không cố đóng vai Đội quân Cứu thế,
tôi chỉ phát bực khi con người tự cưa cành cây mình đang ngồi,
lờ đi sự thật và vấn đề chẳng có lợi gì,
đến cả các thánh cũng không giúp được, mọi thứ sẽ quay lại với chúng ta.', 0
FROM `songs` s
WHERE s.`name` LIKE '%Divná planeta%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Divná planeta%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Hành tinh kỳ lạ' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Trời đất ơi', 'Trời đất ơi, nhìn xem dưới đáy người ta sống thế nào,
ít nhất hãy thử đặt mình vào vai tao một lúc,
bi tao toát mồ hôi vì phải cày cuốc,
và tao phát ốm khi biết mình sẽ nhận được bao ít cho chuyện đó.
Tụi mày ngồi trên tai mình trong cà vạt, chải chuốt, thơm tho, ví căng phồng,
nó đè vào đít tụi mày mà tụi mày vẫn chưa thấy đủ,
tao không mù, không ngu, cũng chẳng phải trẻ nhất,
nhưng tao có kế hoạch của mình, nó sẽ cứu tao,
CD của bọn tao sẽ dễ kiếm ở khắp nơi.
Bọn tao sẽ cho mày thấy những thứ đến giờ mày chưa từng biết,
tao chẳng bận tâm việc tao làm những thứ không hợp pháp,
trái cấm ở đây đâu cũng dễ kiếm,
và vì thế lũ cớm thích phóng qua làng tao,
chắc chúng thấy không bình thường lắm
khi tao chẳng nộp thuế cho những gì tao làm.

Kế hoạch và chiến thuật nghe nói chẳng có nghĩa gì với tao,
tao ngạc nhiên khi nghe người ta trách tao vì điều đó,
hôm qua tao làm đúng những gì hôm nay tao làm,
từ sáng đến tối tao lảng vảng ở Tesco,
tao lúc nào cũng phải nhậu, dù sao tao cũng chẳng muốn dừng,
tao sống và kiếm lời chỉ từ đồ bố thí của thành phố,
nhiều lần tao phải ngủ trên vỉa hè,
tao là đồ ăn bám trợ cấp, người tao bốc mùi mục rữa,
tao và băng của tao chiếm lấy vị trí,
ngày qua ngày bọn tao đòi tiền của mọi người xung quanh,
tao ngồi xuống đất với một con chó đói,
mày thấy một cái chân với chiếc mũ, mày đi vòng thật xa tránh tao,
tao tự chuốc lấy, tao bị bầm một bên mắt,
tao chẳng nhúc nhích khỏi chỗ, tao vẫn ở đúng nơi tao ở năm ngoái,
tao là đồ cặn bã lười biếng, cái nhãn đó không rửa sạch được,
kế hoạch của tao là cả đời cày bê tông bằng mặt.', 0
FROM `songs` s
WHERE s.`name` LIKE 'Skeli a Babar - No ty vole%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE 'Skeli a Babar - No ty vole%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Trời đất ơi' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
INSERT INTO `lyrics` (`song_id`, `lang`, `title`, `words`, `score`)
SELECT s.`id`, 'vi', 'Một người bình thường', 'Người ta bảo tôi phải mỉm cười, đi theo bầy đàn,
luồn cúi bợ đỡ người khác, có khi còn phải lau đít cho họ,
người ta bảo tôi nên biết kiềm chế và đừng làm quá lên như thế,
và chấp nhận mọi thứ như nó vốn là, lê chân, cúi đầu.
Đừng bận tâm chuyện này, chuyện đó mày chẳng thay đổi được, mày chẳng làm gì được,
đừng suy nghĩ, tắt não đi, cày đến khi rã rời thân xác,
ý kiến của mày tốt nhất cứ giữ cho riêng mình,
mày không ở đây để thay đổi dòng chảy của những điều tồi tệ.

Mày là một người bình thường, số phận mày là bới móc trong đống phân,
cả đời trả nợ hóa đơn, để mặc người ta lôi đi,
chuyến tàu của mày đã chạy mất ngay khoảnh khắc mày chào đời,
vậy nên im mồm đi, bước cho đều và quay lại hàng ngũ.
(2×)

Tôi là thằng khốn nhỏ con, cao gần một mét rưỡi,
tôi ló đầu ra khỏi đám đông, họ muốn xiên tôi lên cọc,
tôi đã lãnh những đòn đau, họ còn rắc muối vào đó,
vô số đòn nữa tôi vẫn sẽ còn lãnh,
chúng bay tới từ mọi phía, và tôi không làm gì chỉ vì nó trông cool,
tôi chẳng có cùng sở thích với mọi thằng ngốc khác,
vì tính cách mà tôi luôn phải trả giá xứng đáng,
thật tệ khi tôi thành công nổi bật khỏi mức trung bình,
không ai được phép đứng dưới mức trung bình hay trên mức trung bình,
giữ những giấc mơ cho riêng mày, liệu mà chộp lấy chúng, mẹ kiếp,
mày chỉ phải cày, ngủ, cày, ngủ, cày, ngủ,
kiếm toàn thứ vớ vẩn, thứ vớ vẩn đổ thẳng vào bồn cầu, cảm ơn, tôi không hứng thú
đi theo bầy đàn, tôi thật sự không điên, tôi theo kế hoạch của riêng mình,
ý kiến của mày tốt nhất cứ giữ cho riêng mình,
tôi sẽ đi theo cách của tôi, chừng nào tôi còn hơi thở.

Mày là một người bình thường, số phận mày là bới móc trong đống phân,
cả đời trả nợ hóa đơn, để mặc người ta lôi đi,
chuyến tàu của mày đã chạy mất ngay khoảnh khắc mày chào đời,
vậy nên im mồm đi, bước cho đều và quay lại hàng ngũ.
(2×)', 0
FROM `songs` s
WHERE s.`name` LIKE '%Obyčejnej člověk%'
  AND NOT EXISTS (SELECT 1 FROM `lyrics` l WHERE l.`song_id` = s.`id` AND l.`lang` = 'vi')
ORDER BY s.`id`
LIMIT 1;
UPDATE `lyrics` l JOIN (SELECT `id` FROM `songs` WHERE `name` LIKE '%Obyčejnej člověk%' ORDER BY `id` LIMIT 1) s ON s.`id` = l.`song_id`
SET l.`title` = 'Một người bình thường' WHERE l.`lang` = 'vi' AND (l.`title` IS NULL OR l.`title` = '');
