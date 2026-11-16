"""Reproducible comparison of the two authored whole-share orders (USD)."""
from pathlib import Path
from decimal import Decimal as D
import os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/wise-broker-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.patches import Patch

ROOT = Path(__file__).resolve().parent
FONT = '/System/Library/Fonts/PingFang.ttc'
fp = lambda size: FontProperties(fname=FONT, size=size)
navy, blue, gold = '#182C44', '#437DA7', '#BE9655'

def fee(qty, price, rate, minimum, cap):
    return min(max(D(qty)*D(rate),D(minimum)),D(qty*price)*D(cap))

values=[]
for qty, price in [(100,50),(1000,5)]:
    values.append([fee(qty,price,'.0055','1','.02'),D('0'),fee(qty,price,'.0035','.35','.01'),fee(qty,price,'.005','1','.01')])
assert values == [[D('1'),D('0'),D('.35'),D('1')],[D('5.5'),D('0'),D('3.5'),D('5')]]
fig=plt.figure(figsize=(12,9),dpi=100,facecolor='#FBFBFA')
fig.text(.06,.925,'同样买入 $5,000',fontproperties=fp(32),color=navy)
fig.text(.06,.869,'股数不同，按股收费就不同',fontproperties=fp(20),color='#657587')
ax=fig.add_axes([.27,.18,.61,.59],facecolor='#FBFBFA')
labels=['BBAE','嘉信','IBKR Tiered','IBKR Fixed']
ypos=[3.9,2.65,1.4,.15]
for col,(series,offset,color) in enumerate(zip(values,[.19,-.19],[blue,gold])):
    for y,value in zip(ypos,series):
        val=float(value)
        if val:
            ax.barh(y+offset,val,height=.26,color=color,zorder=3)
        else:
            ax.plot(0,y+offset,'o',color=color,markerfacecolor='#FBFBFA',markersize=5,clip_on=False,zorder=4)
        ax.text(val+.10,y+offset,f'${value:.2f}',fontproperties=fp(19),va='center',color=navy,zorder=5)
ax.set_xlim(0,6.25);ax.set_ylim(-.45,4.55)
ax.set_yticks(ypos,labels,fontproperties=fp(20));ax.tick_params(axis='y',length=0,pad=22,labelcolor=navy)
ax.set_xticks(range(7),[str(n) for n in range(7)],fontproperties=fp(15));ax.tick_params(axis='x',length=0,pad=12,labelcolor='#6D7B8A')
ax.grid(axis='x',color='#E5E7E8',linewidth=.7,zorder=0)
for spine in ax.spines.values():spine.set_visible(False)
ax.set_xlabel('佣金＋平台费（美元）',fontproperties=fp(16),color='#657587',labelpad=12)
fig.legend(handles=[Patch(facecolor=blue,label='100 股 × $50'),Patch(facecolor=gold,label='1,000 股 × $5')],loc='upper left',bbox_to_anchor=(.263,.84),ncol=2,frameon=False,prop=fp(18),handlelength=1.2,columnspacing=2.5)
fig.text(.06,.064,'整股、单笔完整成交；未计全部第三方费用与价差。',fontproperties=fp(16),color='#657587')
fig.text(.06,.029,'按正文核验的 2026-11-17 费率计算；IBKR Tiered 使用月量首档。',fontproperties=fp(13),color='#7D8791')
fig.savefig(ROOT/'fee-comparison-raw.png',dpi=100,facecolor=fig.get_facecolor())
print('Saved exact fee comparison, 1200×900')
