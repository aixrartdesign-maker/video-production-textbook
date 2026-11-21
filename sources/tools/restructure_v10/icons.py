# 24 mini schematics for the "scene lighting dictionary" spread. No text inside (language-neutral).
W,H=160,100
INK='#1B1B1D';WINE='#7A1C2B';BG='#F6F5F3';GR='#9A9AA0';WARM='#E09A3A';COOL='#4A7AB5';MAG='#C2408C';CYN='#2FA3B3'
def svg(body,bg=BG): return f'<svg viewBox="0 0 {W} {H}" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg"><rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>'
def head_top(x=80,y=50,ang=0,lit=None):
    import math
    a=math.radians(ang); nx,ny=x+13*math.sin(a),y+13*math.cos(a)
    lx,ly=x+9*math.sin(a+1.2),y+9*math.cos(a+1.2); rx,ry=x+9*math.sin(a-1.2),y+9*math.cos(a-1.2)
    s=f'<circle cx="{x}" cy="{y}" r="11" fill="#D9D6D0" stroke="{INK}" stroke-width="1"/><polygon points="{lx:.1f},{ly:.1f} {nx:.1f},{ny:.1f} {rx:.1f},{ry:.1f}" fill="{INK}"/>'
    return s
def cam(x=80,y=90): return f'<rect x="{x-7}" y="{y-5}" width="14" height="9" rx="1.5" fill="{INK}"/><rect x="{x-3}" y="{y-8}" width="6" height="4" fill="{INK}"/>'
def cam_side(x=18,y=52): return f'<rect x="{x-8}" y="{y-5}" width="13" height="10" rx="1.5" fill="{INK}"/><rect x="{x+5}" y="{y-3}" width="5" height="6" fill="{INK}"/>'
def beam(x1,y1,x2,y2,c=WINE,w=9,op=.16):
    import math
    dx,dy=x2-x1,y2-y1;L=math.hypot(dx,dy);px,py=-dy/L*w,dx/L*w
    return f'<polygon points="{x1},{y1} {x2+px:.1f},{y2+py:.1f} {x2-px:.1f},{y2-py:.1f}" fill="{c}" opacity="{op}"/>'
def lamp(x,y,c=WINE,tx=80,ty=50,w=9,op=.16,r=5): return beam(x,y,tx,ty,c,w,op)+f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def soft(x,y,wd=26,ht=6,c=WINE): return f'<rect x="{x-wd/2}" y="{y-ht/2}" width="{wd}" height="{ht}" rx="1" fill="{c}"/>'
def refl(x1,y1,x2,y2): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#FFFFFF" stroke-width="5"/><line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{GR}" stroke-width="1"/>'
def flag(x1,y1,x2,y2): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="4"/>'
def head_side(x=92,y=50,face='l'):
    n=-1 if face=='l' else 1
    return f'<circle cx="{x}" cy="{y}" r="12" fill="#D9D6D0" stroke="{INK}" stroke-width="1"/><polygon points="{x+11*n},{y-4} {x+17*n},{y+1} {x+11*n},{y+4}" fill="{INK}"/><path d="M{x-10},{y+12} q10,16 20,0" fill="none" stroke="{INK}" stroke-width="1"/>'
def ground(y=78): return f'<line x1="0" y1="{y}" x2="{W}" y2="{y}" stroke="{GR}" stroke-width="1"/>'
def sun(x,y,c=WARM,r=8): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'+''.join(f'<line x1="{x+ (r+3)*__import__("math").cos(k*0.785):.1f}" y1="{y+(r+3)*__import__("math").sin(k*0.785):.1f}" x2="{x+(r+7)*__import__("math").cos(k*0.785):.1f}" y2="{y+(r+7)*__import__("math").sin(k*0.785):.1f}" stroke="{c}" stroke-width="1.5"/>' for k in range(8))
def person(x=80,y=78,c=INK,h=34):
    return f'<circle cx="{x}" cy="{y-h+5}" r="5.5" fill="{c}"/><rect x="{x-6}" y="{y-h+11}" width="12" height="{h-11}" rx="5" fill="{c}"/>'
I={}
# A. faces
I['broad']=svg(head_top(80,48,35)+lamp(38,78,tx=74,ty=52)+cam(80,90))
I['short']=svg(head_top(80,48,35)+lamp(128,62,tx=86,ty=50)+cam(80,90))
I['clam']=svg(head_side(100,48)+soft(70,22,24,6)+beam(70,24,92,44,WINE,7)+refl(66,70,84,64)+beam(76,67,94,56,'#FFFFFF',6,.9)+cam_side(20,48))
I['top']=svg(head_side(92,52)+lamp(92,10,tx=92,ty=40,w=10)+f'<ellipse cx="92" cy="55" rx="7" ry="2.5" fill="{INK}" opacity=".5"/>'+cam_side(20,52))
I['under']=svg(head_side(96,40)+lamp(86,88,tx=94,ty=52,w=9)+cam_side(20,40))
I['kicker']=svg(head_top(80,52,0)+lamp(130,18,tx=88,ty=46,w=6)+f'<path d="M89,44 a11,11 0 0 1 2,12" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>'+cam(80,92))
# B. time & weather
I['golden']=svg(f'<rect width="{W}" height="78" fill="#F4E2C4"/>'+ground()+sun(128,70,WARM,9)+person(78)+f'<path d="M84,45 q4,10 2,30" stroke="{WARM}" stroke-width="2" fill="none"/>'+refl(48,60,56,76)+f'<line x1="78" y1="78" x2="20" y2="88" stroke="{INK}" stroke-width="3" opacity=".25"/>')
I['blue']=svg(f'<rect width="{W}" height="78" fill="#3E5C8A"/>'+f'<rect y="78" width="{W}" height="22" fill="#24344F"/>'+''.join(f'<rect x="{x}" y="{y}" width="3" height="3" fill="{WARM}"/>' for x,y in [(14,60),(22,52),(30,64),(118,56),(132,62),(146,50),(140,70)])+f'<path d="M110,78 a14,14 0 0 1 28,0" fill="{WARM}" opacity=".5"/>'+person(78,78,'#111'))
I['overcast']=svg(f'<path d="M12,26 q8,-14 24,-6 q10,-12 26,-2 q14,-10 28,0 q16,-8 26,4 q16,0 18,12 z" fill="#C9C9CE"/>'+''.join(beam(x,24,80,52,'#9AA0A8',6,.12) for x in (30,60,100,130))+head_top(80,56,0)+flag(104,44,108,70)+cam(80,92))
I['noon']=svg(sun(80,10,WARM,7)+f'<rect x="54" y="26" width="52" height="5" fill="#FFFFFF" stroke="{GR}"/>'+ground(84)+person(80,84)+f'<ellipse cx="80" cy="85" rx="9" ry="2.5" fill="{INK}" opacity=".45"/>')
I['window']=svg(f'<line x1="18" y1="6" x2="18" y2="94" stroke="{INK}" stroke-width="4"/><rect x="15" y="24" width="7" height="40" fill="#CFE0F0"/>'+f'<polygon points="22,24 22,64 70,58 70,40" fill="#CFE0F0" opacity=".7"/>'+head_top(82,50,20)+f'<rect x="100" y="6" width="60" height="94" fill="{INK}" opacity=".12"/>'+cam(92,90))
I['leaves']=svg(sun(140,14,WARM,7)+''.join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="3" fill="#5C7A4A" transform="rotate({r} {x} {y})"/>' for x,y,r in [(108,30,20),(118,36,-30),(100,40,40),(112,24,-10),(124,28,15)])+head_top(70,62,0)+''.join(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#F6D27A"/>' for x,y in [(66,58),(74,64),(70,68),(62,64),(78,57),(50,72),(90,74),(40,60)]))
# C. night & interior
I['moon']=svg(f'<rect width="{W}" height="{H}" fill="#1E2A40"/>'+f'<circle cx="128" cy="20" r="9" fill="#DDE6F2"/><circle cx="133" cy="17" r="8" fill="#1E2A40"/>'+beam(124,24,86,46,'#BFD3EE',7,.25)+f'<circle cx="80" cy="54" r="11" fill="#2F3B55" stroke="#BFD3EE" stroke-width="1.5"/>'+f'<polygon points="74,62 80,67 86,62" fill="#0E1420"/>'+cam(80,90).replace(INK,'#0E1420'))
I['dfn']=svg(f'<rect width="{W}" height="78" fill="#7F96B8"/><rect y="78" width="{W}" height="22" fill="#4A5A75"/>'+sun(130,22,'#F2F2F2',7)+person(80,78,'#2A3550')+f'<rect x="8" y="8" width="44" height="20" rx="3" fill="{INK}" opacity=".75"/><text x="30" y="22" text-anchor="middle" font-family="Noto Sans CJK KR" font-size="11" fill="#FFFFFF">−2 EV</text>')
I['street']=svg(f'<rect width="{W}" height="{H}" fill="#2A2420"/>'+f'<line x1="40" y1="94" x2="40" y2="14" stroke="#777" stroke-width="3"/><line x1="40" y1="14" x2="62" y2="14" stroke="#777" stroke-width="3"/><circle cx="64" cy="17" r="4" fill="#F2A33A"/>'+f'<polygon points="64,20 40,92 112,92" fill="#F2A33A" opacity=".28"/>'+person(84,92,'#0D0B0A')+f'<ellipse cx="84" cy="93" rx="12" ry="2" fill="#000" opacity=".6"/>')
I['candle']=svg(f'<rect width="{W}" height="{H}" fill="#1A1410"/>'+f'<ellipse cx="80" cy="70" rx="54" ry="30" fill="{WARM}" opacity=".25"/>'+f'<circle cx="80" cy="40" r="12" fill="#7A4A26"/>'+''.join(f'<rect x="{x}" y="72" width="5" height="16" fill="#EDE3D0"/><path d="M{x+2.5},64 q-3,5 0,8 q3,-3 0,-8" fill="#F6C24A"/>' for x in (64,76,88)))
I['screen']=svg(f'<rect width="{W}" height="{H}" fill="#101418"/>'+f'<polygon points="62,74 98,74 96,58 64,58" fill="#AFC8E6" opacity=".25"/>'+f'<rect x="60" y="66" width="40" height="22" fill="#2C3440"/><rect x="62" y="64" width="36" height="3" fill="#CFE2F7"/>'+beam(80,64,80,34,'#BBD6F2',13,.35)+f'<circle cx="80" cy="34" r="11" fill="#3A4A5E"/>')
I['blinds']=svg(f'<rect width="{W}" height="{H}" fill="#3A332C"/>'+''.join(f'<polygon points="10,{y} 10,{y+4} 150,{y+16} 150,{y+11}" fill="#F0D9A8" opacity=".75"/>' for y in range(8,92,12))+f'<rect x="4" y="4" width="10" height="92" fill="#8A7A66"/>'+f'<circle cx="108" cy="48" r="13" fill="#2A241F" opacity=".85"/>')
# D. genre & emotion
I['volume']=svg(f'<rect width="{W}" height="{H}" fill="#3B3F45"/>'+''.join(f'<polygon points="{x},0 {x+12},0 {x+44},100 {x+26},100" fill="#E8E4DA" opacity=".18"/>' for x in (24,58,92))+''.join(f'<circle cx="{(i*37)%160}" cy="{(i*53)%100}" r="1" fill="#FFF" opacity=".5"/>' for i in range(1,30))+person(96,96,'#15171A'))
I['neon']=svg(f'<rect width="{W}" height="{H}" fill="#14121C"/>'+f'<rect x="12" y="14" width="6" height="56" rx="3" fill="{MAG}"/><rect x="142" y="14" width="6" height="56" rx="3" fill="{CYN}"/>'+beam(18,42,72,50,MAG,10,.35)+beam(142,42,88,50,CYN,10,.35)+f'<circle cx="80" cy="50" r="11" fill="#2A2533"/><path d="M80,39 a11,11 0 0 0 0,22" fill="{MAG}" opacity=".55"/><path d="M80,39 a11,11 0 0 1 0,22" fill="{CYN}" opacity=".55"/>')
I['warmcool']=svg(head_top(80,50,0)+lamp(36,74,WARM,74,54,10,.25)+lamp(128,16,COOL,88,44,7,.3)+cam(80,90))
I['spot']=svg(f'<rect width="{W}" height="{H}" fill="#121214"/>'+f'<circle cx="80" cy="6" r="5" fill="#F2F2F2"/><polygon points="80,8 58,86 102,86" fill="#F2F2F2" opacity=".22"/><ellipse cx="80" cy="88" rx="24" ry="5" fill="#F2F2F2" opacity=".3"/>'+person(80,88,'#3A3A3E'))
I['strobe']=svg(f'<rect width="{W}" height="{H}" fill="#18181C"/>'+f'<polygon points="96,6 70,50 86,50 66,94 112,40 94,40 112,6" fill="#F4F0B8"/>'+''.join(f'<rect x="{x}" y="70" width="8" height="24" fill="#F4F0B8" opacity="{o}"/>' for x,o in [(14,.9),(28,.15),(42,.9),(56,.15)]))
I['passing']=svg(f'<rect width="{W}" height="{H}" fill="#1C2026"/>'+f'<rect x="54" y="30" width="52" height="40" rx="4" fill="#2E3540" stroke="#55606E"/>'+f'<circle cx="80" cy="46" r="9" fill="#141820"/>'+''.join(f'<polygon points="{x},20 {x+8},20 {x+30},80 {x+22},80" fill="#F2E2B0" opacity="{o}"/>' for x,o in [(20,.55),(110,.2)])+f'<path d="M24,90 h40" stroke="#F2E2B0" stroke-width="2" marker-end="url(#a)"/><defs><marker id="a" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#F2E2B0"/></marker></defs>')
ORDER=[['broad','short','clam','top','under','kicker'],['golden','blue','overcast','noon','window','leaves'],['moon','dfn','street','candle','screen','blinds'],['volume','neon','warmcool','spot','strobe','passing']]
if __name__=='__main__':
    import sys
    html='<html><body style="background:#fff">'+''.join(f'<div style="display:inline-block;margin:4px;width:220px"><div>{k}</div>{I[k]}</div>' for g in ORDER for k in g)+'</body></html>'
    open('/tmp/icons.html','w').write(html)
