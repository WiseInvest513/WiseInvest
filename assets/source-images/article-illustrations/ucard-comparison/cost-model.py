"""Reproduce the authored USD cost scenarios. Illustrations are not live quotes."""
from pathlib import Path
from decimal import Decimal as D
import json, os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/wise-ucard-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties

ROOT = Path(__file__).resolve().parent
FONT = '/System/Library/Fonts/PingFang.ttc'
fp = lambda size: FontProperties(fname=FONT, size=size)
navy, blue, gold = '#182C44', '#467E9A', '#BF9755'

def model(amount):
    a=D(str(amount))
    return {
        'Bitget APAC': [a*D('1.0005'),a*D('1.002')],
        'Bybit APAC': [a*D('1.009')]*2,
        'Gate Classic/Platinum': [a*D('1.009')]*2,
        'Gate Blue/AI': [a/D('.991')]*2,
        'MP Cloud': [a*D('1.008')/D('.998'),a*D('1.008')/D('.993')],
        'SafePal USDC to USD': [a]*2,
        'BenPay Delta': [(a+D('.05'))/D('.995')]*2,
    }

calculations = {str(a): {k:[str(v) for v in vals] for k,vals in model(a).items()} for a in [20,200]}
calculations['BenPay monthly 20 USD + 1U fee'] = str((D(20)+D('.05')+D(1))/D('.995'))
(ROOT/'cost-model.json').write_text(json.dumps(calculations,indent=2)+'\n')

fig=plt.figure(figsize=(12,8.4),dpi=100,facecolor='#FBFBFA')
fig.text(.055,.89,'支付 $200，基础费用多少？',fontproperties=fp(29),color=navy)
fig.text(.055,.83,'美元订单 · 加密资金支付 · 未扣返现',fontproperties=fp(18),color='#657587')
ax=fig.add_axes([.30,.24,.57,.50],facecolor='#FBFBFA')
keys=['Bitget APAC','Bybit APAC','Gate Classic/Platinum','Gate Blue/AI','MP Cloud']
labels=['Bitget Wallet APAC','Bybit APAC','Gate 经典／铂金','Gate Blue／AI','MP 云影']
values=model(200)
for i,key in enumerate(keys):
    lo,hi=[float(x-D(200)) for x in values[key]]
    y=4-i
    ax.barh(y,lo,height=.32,color=blue,zorder=3)
    if hi>lo:
        ax.barh(y,hi-lo,left=lo,height=.32,color=gold,zorder=3)
        label=f'${lo:.2f}–{hi:.2f}'
    else:label=f'${lo:.2f}'
    ax.text(hi+.085,y,label,fontproperties=fp(19),color=navy,va='center')
ax.set_xlim(0,3.9);ax.set_ylim(-.5,4.5)
ax.set_yticks(range(4,-1,-1),labels,fontproperties=fp(17));ax.tick_params(axis='y',length=0,pad=17,labelcolor=navy)
ax.set_xticks([0,1,2,3],['0','1','2','3'],fontproperties=fp(15));ax.tick_params(axis='x',length=0,pad=12,labelcolor='#6D7B8A')
ax.set_xlabel('费用（美元等值）',fontproperties=fp(16),color='#657587',labelpad=12)
ax.grid(axis='x',color='#E5E7E8',linewidth=.7,zorder=0)
for spine in ax.spines.values():spine.set_visible(False)
fig.text(.055,.13,'金色为费用区间；MP 计入官方示例兑换差价。',fontproperties=fp(16),color='#657587')
fig.text(.055,.084,'不含开卡、月费、入金通道、链上费用、税及特殊验证费。',fontproperties=fp(15),color='#657587')
fig.text(.055,.04,'费用模型，并非实刷报价。假设与公式见正文；资料核对：2026-11-17。',fontproperties=fp(13),color='#7D8791')
fig.savefig(ROOT/'usd-cost-model-raw.png',dpi=100,facecolor=fig.get_facecolor())
print(json.dumps(calculations,indent=2))
