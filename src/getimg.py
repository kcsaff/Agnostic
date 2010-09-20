#Quick script to grab tarot images from sacred texts.

for i in range(22):
    print 'http://www.sacred-texts.com/tarot/pkt/img/ar%02d.jpg' % i

for suit in 'wa cu sw pe'.split():
    for rank in 'ac 02 03 04 05 06 07 08 09 10 pa kn qu ki'.split():
        print 'http://www.sacred-texts.com/tarot/pkt/img/%s%s.jpg' % (suit, rank)
