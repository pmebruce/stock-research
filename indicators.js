/* Price-only research rules. No forecast probability or generated market facts. */
(function(root){
  const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  const sma=(a,n)=>a.length>=n?mean(a.slice(-n)):null;
  const pct=(a,b)=>(a/b-1)*100;
  function ema(a,n){let e=mean(a.slice(0,n));const out=a.map(()=>null);out[n-1]=e;for(let i=n;i<a.length;i++){e+=(a[i]-e)*2/(n+1);out[i]=e}return out}
  function rsi(a,n=14){let g=0,l=0;for(let i=1;i<=n;i++){const d=a[i]-a[i-1];g+=Math.max(d,0);l+=Math.max(-d,0)}g/=n;l/=n;for(let i=n+1;i<a.length;i++){const d=a[i]-a[i-1];g=(g*(n-1)+Math.max(d,0))/n;l=(l*(n-1)+Math.max(-d,0))/n}return g===0&&l===0?50:l===0?100:100-100/(1+g/l)}
  function macd(a){const fast=ema(a,12),slow=ema(a,26);const line=a.map((_,i)=>slow[i]===null?null:fast[i]-slow[i]);const signal=ema(line.slice(25),9);const hist=line.slice(25).map((v,i)=>signal[i]===null?null:v-signal[i]);const h=hist.at(-1),prev=hist.at(-2);return {line:line.at(-1),signal:signal.at(-1),hist:h,previous:prev,cross:h>0&&prev<=0?'up':h<0&&prev>=0?'down':null}}
  function analyze(item,quote){
    const prices=quote.prices;if(prices.length<60||prices.some(v=>!Number.isFinite(v)||v<=0))throw Error('至少需要60筆有效收盤價');
    const last=prices.at(-1),ma5=sma(prices,5),ma20=sma(prices,20),ma60=sma(prices,60),slope20=pct(ma20,sma(prices.slice(0,-5),20));
    const bull=last>ma20&&ma20>ma60,bear=last<ma20&&ma20<ma60,bias=bull?'bull':bear?'bear':'flat';
    const momentum=macd(prices),r=rsi(prices);const prior=prices.slice(-21,-1),resistance=Math.max(...prior),support=Math.min(...prior);
    const sd=Math.sqrt(mean(prices.slice(-20).map(v=>(v-ma20)**2)));const upper=ma20+2*sd,lower=ma20-2*sd;
    const returns=prices.slice(-21).slice(1).map((p,i)=>Math.log(p/prices.slice(-21)[i]));const av=mean(returns);const volatility=Math.sqrt(returns.reduce((s,v)=>s+(v-av)**2,0)/(returns.length-1))*Math.sqrt(252)*100;
    let peak=prices.at(-60),drawdown=0;for(const p of prices.slice(-60)){peak=Math.max(peak,p);drawdown=Math.min(drawdown,pct(p,peak))}
    const breakout=last>resistance,breakdown=last<support;
    const trendText=bull?`收盤 ${last.toFixed(2)} > 20日均線 ${ma20.toFixed(2)} > 60日均線 ${ma60.toFixed(2)}，短中期排列偏多。`:bear?`收盤 ${last.toFixed(2)} < 20日均線 ${ma20.toFixed(2)} < 60日均線 ${ma60.toFixed(2)}，短中期排列偏空。`:`價格與20、60日均線尚未同向排列，較接近整理或趨勢轉換。`;
    const momentumText=`MACD柱狀值 ${momentum.hist.toFixed(2)}，${momentum.hist>=0?'短期動能偏上':'短期動能偏下'}，相較上一日${momentum.hist>momentum.previous?(momentum.hist<0?'負值收斂，下跌動能減弱':'柱狀值上升，上漲動能增強'):momentum.hist<momentum.previous?(momentum.hist>0?'正值縮小，上漲動能減弱':'柱狀值下降，下跌動能增強'):'柱狀值持平'}。${momentum.cross==='up'?'今日柱狀值由負轉正。':momentum.cross==='down'?'今日柱狀值由正轉負。':''}RSI ${r.toFixed(0)}，${r>70?'近期漲勢較集中，強勢可能延續，也可能回檔。':r<30?'近期跌勢較集中，不能單憑低RSI判斷已落底。':'尚未進入70以上或30以下區域。'}`;
    const hot=r>70||last>upper;const conflict=(bull&&momentum.hist<0)||(bear&&momentum.hist>0);
    let summary=bull?'均線排列偏多':bear?'均線排列偏空':'價格仍在整理或轉換';summary+=conflict?'，但動能方向不一致。':momentum.hist>0?'，MACD動能偏上。':momentum.hist<0?'，MACD動能偏下。':'，MACD動能中性。';if(hot)summary+='目前位置偏熱，追價承受回檔的風險較高。';if(breakout)summary+='收盤已超過前20日收盤高點，但尚未做量能確認。';if(breakdown)summary+='收盤已低於前20日收盤低點，原區間失守。';
    const monitor=item.kind==='hold'?`持股追蹤：留意收盤是否持續在20日均線 ${ma20.toFixed(2)} 上方，以及MACD動能是否同步。若跌破前20日收盤低點 ${support.toFixed(2)}，需重新檢視原持有假設。`:`觀察追蹤：若收盤超過前20日收盤高點 ${resistance.toFixed(2)}，後續需確認能否維持；若跌破 ${support.toFixed(2)}，原區間假設需重評。突破仍需搭配成交量與事件背景。`;
    const shares=Number(item.shares),cost=Number(item.cost);const holding=item.kind==='hold'&&shares>0&&cost>0?{value:last*shares,pnl:(last-cost)*shares,return:pct(last,cost)}:null;
    return {prices,last,ma5,ma20,ma60,slope20,bias,rsi:r,macd:momentum,support,resistance,breakout,breakdown,upper,lower,bandWidth:sd===0?0:4*sd/ma20*100,deviation:pct(last,ma20),volatility,drawdown,change:pct(last,prices.at(-2)),returns:[5,20,60].map(n=>({n,value:prices.length>n?pct(last,prices.at(-n-1)):null})),summary,trendText,momentumText,monitor,holding};
  }
  const api={analyze,sma,ema,rsi,macd};root.StockIndicators=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
