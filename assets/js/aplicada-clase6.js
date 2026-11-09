// Clase 6: contrastes conjuntos y restricciones; no repite las lecciones básicas de t.
window.ECON_A6_DATA = {
  mlb1: {filename:"mlb1.csv",url:document.currentScript.dataset.mlbUrl},
  crime1: {filename:"crime1.csv",url:document.currentScript.dataset.crimeUrl}
};
const A6_BASE=String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import f, t, chi2
rng=np.random.default_rng(123)
np.set_printoptions(precision=5,suppress=True)
`;
const A6_MCO=String.raw`
def mco(X,y):
    X,y=np.asarray(X,float),np.asarray(y,float)
    if X.ndim!=2 or y.shape!=(len(X),) or not np.all(np.isfinite(X)) or not np.all(np.isfinite(y)):
        raise ValueError("Usa una matriz X y un vector y finitos con las mismas filas.")
    n,p=X.shape
    if n<=p or np.linalg.matrix_rank(X)<p: raise ValueError("Necesitas más filas que parámetros y columnas independientes.")
    b=np.linalg.lstsq(X,y,rcond=None)[0];e=y-X@b;rss=float(e@e);df=n-p
    if rss<=1e-20: raise ValueError("No hay variación residual para calcular la prueba.")
    A=np.linalg.solve(X.T@X,np.eye(p));V=(rss/df)*A
    sct=float((y-y.mean())@(y-y.mean()))
    return dict(b=b,e=e,rss=rss,df=df,A=A,V=V,r2=1-rss/sct if sct>0 else np.nan)

def restringir(X,y,R,r):
    # H0: R beta = r. Se permiten ceros, igualdades y valores distintos de cero.
    R,r=np.atleast_2d(np.asarray(R,float)),np.atleast_1d(np.asarray(r,float))
    fit=mco(X,y);q=R.shape[0]
    if R.shape[1]!=X.shape[1] or r.shape!=(q,) or not np.all(np.isfinite(R)) or not np.all(np.isfinite(r)) or np.linalg.matrix_rank(R)<q:
        raise ValueError("R debe tener q filas independientes, una columna por parámetro; r tiene q valores.")
    d=R@fit['b']-r;C=R@fit['A']@R.T
    br=fit['b']-fit['A']@R.T@np.linalg.solve(C,d)
    er=y-X@br;rssr=float(er@er)
    F=float(d@np.linalg.solve(C,d)/q/(fit['rss']/fit['df']))
    return fit,br,rssr,F,float(f.sf(F,q,fit['df']))

def validar(n,alpha=.05):
    if not isinstance(n,int) or not 15<=n<=5000 or not 0<alpha<1:
        raise ValueError("Usa n entero entre 15 y 5000 y 0<alpha<1.")
`;
const A6_LABS=[
{
id:"a6-diferencia",title:"01 Clase 6 · Comparar dos efectos: la covarianza importa",
description:"Slides 26–29. Simula dos tipos de educación. Contrasta beta_priv=beta_pub y reparametriza el modelo para estimar directamente la diferencia. Cambia rho y compara el SE correcto con el que ignora la covarianza.",
parameters:String.raw`n,b_priv,b_pub,rho,sigma,alpha=300,.08,.08,.6,.3,.05`,
code:A6_BASE+A6_MCO+String.raw`validar(n,alpha)
if abs(rho)>=1 or sigma<=0: raise ValueError("Usa |rho|<1 y sigma>0.")
priv=rng.normal(size=n);pub=rho*priv+np.sqrt(1-rho**2)*rng.normal(size=n);exper=rng.normal(size=n)
X=np.column_stack([np.ones(n),priv,pub,exper]);y=1+b_priv*priv+b_pub*pub+.04*exper+rng.normal(0,sigma,n)
fit=mco(X,y);b,V=fit['b'],fit['V'];c=np.array([0.,1.,-1.,0.])
theta=c@b;se=np.sqrt(c@V@c);se_sin_cov=np.sqrt(V[1,1]+V[2,2])
T=theta/se;pvalor=2*t.sf(abs(T),fit['df']);crit=t.ppf(1-alpha/2,fit['df'])
# beta_priv*priv+beta_pub*pub = (beta_priv-beta_pub)*priv + beta_pub*(priv+pub).
W=np.column_stack([np.ones(n),priv,priv+pub,exper]);reparam=mco(W,y)
print("Datos simulados; no son una comparación causal real entre instituciones.")
print(f"Diferencia verdadera={b_priv-b_pub:.4f}; estimada={theta:.4f}; Cov(b_priv,b_pub)={V[1,2]:.6f}")
print(f"SE correcto={se:.5f}; ignorando covarianza={se_sin_cov:.5f}; p bilateral={pvalor:.5f}")
print(f"Reparametrización: theta={reparam['b'][1]:.5f}; SE={np.sqrt(reparam['V'][1,1]):.5f}")
print("Var(diferencia)=Var(b_priv)+Var(b_pub)-2*Cov(b_priv,b_pub)")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].errorbar([theta,theta],[1,0],xerr=crit*np.array([se,se_sin_cov]),fmt='o',capsize=6)
ax[0].axvline(0,color='gray',ls='--');ax[0].set(yticks=[0,1],yticklabels=['Ignora cov. (incorrecto)','Usa covarianza'],xlabel='Diferencia estimada e intervalo',title='No basta sumar las dos varianzas')
v=np.array([V[1,1],V[2,2],-2*V[1,2]]);ax[1].bar(['Var(priv)','Var(pub)','−2 Cov'],v)
ax[1].axhline(0,color='gray');ax[1].set(ylabel='Contribución a Var(diferencia)',title='La covarianza puede sumar o restar');fig.tight_layout()
print("Conclusión: preguntar si dos efectos son iguales exige estudiar su diferencia, no si cada uno es significativo por separado. Sus estimaciones se mueven juntas: por eso la covarianza cambia la incertidumbre. Reescribir la misma regresión entrega exactamente la misma diferencia y el mismo SE.")`
},
{
id:"a6-beisbol",title:"02 Clase 6 · Béisbol: significancia individual y conjunta",dataset:"mlb1",
description:"Slides 32–48. Reproduce el ejemplo con 353 jugadores de mlb1. Compara la exclusión conjunta de tres medidas de rendimiento con sus pruebas individuales y con la prueba global. Prueba dejando una sola variable en excluir: F=t².",
parameters:String.raw`excluir=["bavg","hrunsyr","rbisyr"]
alpha=.05`,
code:A6_BASE+A6_MCO+String.raw`variables=['years','gamesyr','bavg','hrunsyr','rbisyr']
if not 0<alpha<1 or not excluir or len(set(excluir))!=len(excluir) or not set(excluir)<=set(variables): raise ValueError("Elige variables distintas del modelo y 0<alpha<1.")
d=pd.read_csv('mlb1.csv')[['lsalary']+variables].dropna();y=d.lsalary.to_numpy()
X=np.column_stack([np.ones(len(d)),d[variables].to_numpy()]);p=X.shape[1]
R=np.eye(p)[[1+variables.index(v) for v in excluir]];q=len(excluir)
fit,br,rssr,F,pvalor=restringir(X,y,R,np.zeros(q))
se=np.sqrt(np.diag(fit['V']));ps=2*t.sf(abs(fit['b']/se),fit['df'])
global_fit,_,_,Fg,pg=restringir(X,y,np.eye(p)[1:],np.zeros(p-1))
sct=np.sum((y-y.mean())**2);r2r=1-rssr/sct
F_r2=((fit['r2']-r2r)/q)/((1-fit['r2'])/fit['df'])
print("mlb1: salarios de 1993, estadísticas de carrera hasta 1992; asociaciones históricas.")
print(pd.DataFrame({'coeficiente':fit['b'],'SE clásico':se,'p individual':ps},index=['constante']+variables).round(6))
print(f"H0: {excluir} tienen coeficientes cero; q={q}, df={fit['df']}")
print(f"RSS restringida={rssr:.6f}; RSS libre={fit['rss']:.6f}; F={F:.5f}; p conjunto={pvalor:.7f}")
print(f"Mismo F usando R²={F_r2:.5f}; F global={Fg:.3f}, p global={pg:.3g}")
if q==1:
    j=1+variables.index(excluir[0]);print(f"Una restricción: F={F:.6f}, t²={(fit['b'][j]/se[j])**2:.6f}; equivale al t BILATERAL.")
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
labels=excluir+['Conjunta'];vals=[ps[1+variables.index(v)] for v in excluir]+[pvalor]
ax[0].scatter(np.maximum(vals,np.finfo(float).tiny),np.arange(len(labels)),s=60);ax[0].set_xscale('log');ax[0].axvline(alpha,color='C1',ls='--',label=f'alpha={alpha:g}')
ax[0].set(yticks=np.arange(len(labels)),yticklabels=labels,xlabel='Valor p (escala log)',title='Son hipótesis distintas');ax[0].legend(fontsize=8)
ax[1].bar(['Libre','Restringido'],[fit['rss'],rssr]);ax[1].set(ylabel='Suma de residuos al cuadrado',title=f'Costo de excluir el bloque: {rssr-fit["rss"]:.2f}');fig.tight_layout()
print("Conclusión:","rechazamos que todo el bloque tenga coeficientes cero." if pvalor<alpha else "no hay evidencia suficiente para rechazar la exclusión conjunta.")
print("Una prueba individual pregunta por una variable manteniendo las otras; F pregunta por todo el bloque a la vez. Con las tres variables por defecto, ninguna es significativa al 5% por separado, pero juntas sí. Rechazar no significa que todas tengan efecto; no rechazar tampoco prueba que sean irrelevantes. La prueba clásica supone homocedasticidad; estos datos observacionales no prueban causalidad.")`
},
{
id:"a6-azar",title:"03 Clase 6 · Prueba F: mejorar el ajuste también puede ser azar",
description:"Slides 38–44 y 73–76. Repite muestras manteniendo X fija. Compara la mejora de ajuste bajo H0 con una alternativa; cambia q, señal y ruido. La curva F de referencia es exacta con errores normales homocedásticos.",
parameters:String.raw`n,B,q,senal,sigma,alpha=120,1500,3,.15,1.0,.05`,
code:A6_BASE+String.raw`if not all(isinstance(v,int) for v in [n,B,q]) or not 20<=n<=1000 or not 100<=B<=5000 or not 1<=q<=10 or n<=q+3 or n*B>3000000 or sigma<=0 or not 0<alpha<1: raise ValueError("Revisa n (20–1000), B (100–5000), q (1–10), n*B<=3 millones, sigma y alpha.")
control=rng.normal(size=n);W=rng.normal(size=(n,q))
Xr=np.column_stack([np.ones(n),control]);X=np.column_stack([Xr,W]);df=n-X.shape[1]
Qr=np.linalg.qr(Xr,mode='reduced')[0];Q=np.linalg.qr(X,mode='reduced')[0]
ruido=rng.normal(0,sigma,size=(n,B));base=(1+control)[:,None]
def contrastes(Y):
    rssr=np.sum((Y-Qr@(Qr.T@Y))**2,axis=0);rssu=np.sum((Y-Q@(Q.T@Y))**2,axis=0)
    ganancia=np.maximum(rssr-rssu,0);F=(ganancia/q)/(rssu/df)
    return ganancia,F
gan0,F0=contrastes(base+ruido);gan1,F1=contrastes(base+senal*W.sum(axis=1)[:,None]+ruido)
crit=f.ppf(1-alpha,q,df)
print(f"q={q} restricciones; df={df}; F crítico={crit:.4f}")
print(f"Mejora RSS media bajo H0={gan0.mean():.4f}; referencia q*sigma²={q*sigma**2:.4f}")
print(f"Rechazo bajo H0={np.mean(F0>crit):.3f}; bajo alternativa={np.mean(F1>crit):.3f}")
print(f"Incertidumbre Monte Carlo del rechazo bajo H0: SE≈{np.sqrt(alpha*(1-alpha)/B):.4f}.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].hist(gan0,bins=40,density=True,alpha=.6,label='Variables sin efecto');ax[0].hist(gan1,bins=40,density=True,histtype='step',label='Variables con efecto')
ax[0].set(xlabel='RSS restringida − RSS libre',ylabel='Densidad',title='Agregar variables mejora incluso bajo H0');ax[0].legend(fontsize=8)
lim=max(f.ppf(.995,q,df),np.quantile(F1,.99));g=np.linspace(.001,lim,400)
ax[1].hist(F0,bins=40,density=True,alpha=.5,label='H0 simulada');ax[1].plot(g,f.pdf(g,q,df),label='F teórica bajo H0')
ax[1].hist(F1,bins=40,density=True,histtype='step',label='Alternativa');ax[1].axvline(crit,color='black',ls='--',label='Crítico')
ax[1].set(xlabel='F: mejora por restricción / ruido estimado',ylabel='Densidad',title='¿La mejora supera la esperable por azar?');ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: el modelo libre siempre puede ajustar mejor, aunque las variables nuevas no aporten señal real. F compara la mejora por restricción con el ruido que queda. Una mejora positiva no basta para rechazar H0. Pon senal=0: ambos escenarios coinciden. Aquí X se mantiene fija y solo cambia el error entre muestras; la normalidad se exige al error, no a X ni a y.")`
},
{
id:"a6-cobb",title:"04 Clase 6 · Cobb–Douglas: imponer rendimientos constantes",
description:"Slides 49–51. Producción simulada. Contrasta beta_L+beta_K=1, estima el modelo restringido y muestra por qué no se pueden comparar R² cuando cambia la variable dependiente.",
parameters:String.raw`n,b_L,b_K,sigma,alpha=100,.35,.65,.15,.05`,
code:A6_BASE+A6_MCO+String.raw`validar(n,alpha)
if sigma<=0: raise ValueError("Usa sigma>0.")
lnL=rng.normal(3,.6,n);lnK=.7*lnL+rng.normal(1,.4,n)
lnY=.5+b_L*lnL+b_K*lnK+rng.normal(0,sigma,n);X=np.column_stack([np.ones(n),lnL,lnK])
fit,br,rssr,F,pvalor=restringir(X,lnY,[[0,1,1]],[1])
W=np.column_stack([np.ones(n),lnK-lnL]);reparam=mco(W,lnY-lnL)
recuperada=np.array([reparam['b'][0],1-reparam['b'][1],reparam['b'][1]])
print("Modelo libre: lnY = constante + beta_L*lnL + beta_K*lnK + u")
print("Modelo restringido: ln(Y/L) = constante + beta_K*ln(K/L) + u")
print("Coeficientes libres:",fit['b'],"; restringidos:",br,"; por transformación:",recuperada)
print(f"Suma verdadera={b_L+b_K:.3f}; suma estimada={fit['b'][1:].sum():.3f}; H0: suma=1")
print(f"F={F:.5f}; p={pvalor:.5f}; RSS libre={fit['rss']:.5f}; restringida={rssr:.5f}")
print(f"R² libre con lnY={fit['r2']:.5f}; R² transformado con ln(Y/L)={reparam['r2']:.5f}: ¡no usar su diferencia para F!")
factores=np.linspace(.5,2,150);fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].plot(factores,factores**fit['b'][1:].sum(),label='Libre');ax[0].plot(factores,factores,'--',label='Suma impuesta = 1');ax[0].plot(factores,factores**(b_L+b_K),':',label='Verdad simulada')
ax[0].set(xlabel='Multiplicador común de L y K',ylabel='Multiplicador de producción sin ruido',title='Duplicar ambos insumos');ax[0].legend(fontsize=8)
ax[1].scatter(lnK-lnL,lnY-lnL,s=14,alpha=.5);g=np.linspace((lnK-lnL).min(),(lnK-lnL).max(),100)
ax[1].plot(g,reparam['b'][0]+reparam['b'][1]*g,color='C1');ax[1].set(xlabel='ln(K/L)',ylabel='ln(Y/L)',title='El modelo restringido tiene menos libertad');fig.tight_layout()
print("Conclusión:","los datos rechazan rendimientos constantes al nivel elegido." if pvalor<alpha else "los datos son compatibles con rendimientos constantes al nivel elegido; no los demuestran.")
print("La restricción exige que multiplicar trabajo y capital por el mismo factor multiplique la producción por ese factor. Se comparan RSS en la misma muestra: la transformación conserva los residuos. Los R² usan variables dependientes distintas y sus denominadores cambian, así que restarlos daría una prueba equivocada.")`
},
{
id:"a6-matrices",title:"05 Clase 6 · Restricciones en matrices: R beta = r",
description:"Slide 52. Datos simulados para dos restricciones distintas de cero. Edita R y r; observa los coeficientes que cumplen las restricciones y comprueba que la distancia de Wald y la pérdida de ajuste dan el mismo F.",
parameters:String.raw`n,b1,b2,rho,sigma,alpha=150,1.0,1.0,.5,1.0,.05
# Columnas: constante, x1, x2, x3. Cada fila expresa una igualdad.
R=np.array([[0,1,0,0],[0,0,1,0]],dtype=float)
r=np.array([1.,1.])  # beta1=1 y beta2=1
# Alternativa: R=np.array([[0,1,-1,0.]]); r=np.array([0.])`,
code:A6_BASE+A6_MCO+String.raw`validar(n,alpha)
if abs(rho)>=1 or sigma<=0: raise ValueError("Usa |rho|<1 y sigma>0.")
x1=rng.normal(size=n);x2=rho*x1+np.sqrt(1-rho**2)*rng.normal(size=n);x3=rng.normal(size=n)
X=np.column_stack([np.ones(n),x1,x2,x3]);y=.5+b1*x1+b2*x2+.3*x3+rng.normal(0,sigma,n)
fit,br,rssr,F,pvalor=restringir(X,y,R,r);q=len(r)
F_rss=((rssr-fit['rss'])/q)/(fit['rss']/fit['df'])
print("Primeras 6 filas X:\n",X[:6],"\nPrimeros 6 valores y:",y[:6])
print("R=\n",R,"\nr=",r,"\nbeta libre=",fit['b'],"\nbeta restringida=",br)
print("R beta libre − r=",R@fit['b']-r,"\nR beta restringida − r=",R@br-r)
print("Covarianza estimada de R beta:\n",R@fit['V']@R.T)
print(f"q={q}; df={fit['df']}; F por distancia={F:.6f}; F por RSS={F_rss:.6f}; p={pvalor:.6f}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));j=np.arange(4)
ax[0].bar(j-.18,fit['b'],.36,label='Libre');ax[0].bar(j+.18,br,.36,label='Restringido');ax[0].set(xticks=j,xticklabels=['Constante','x1','x2','x3'],ylabel='Coeficiente',title='La restricción puede mover otros coeficientes');ax[0].legend(fontsize=8)
pasos=np.linspace(0,1,100);camino=fit['b'][None,:]+pasos[:,None]*(br-fit['b'])[None,:]
costos=np.sum((y[:,None]-X@camino.T)**2,axis=0)-fit['rss']
ax[1].plot(pasos,costos);ax[1].set(xlabel='De beta libre (0) a beta restringida (1)',ylabel='Aumento de RSS',title='Imponer la hipótesis cuesta ajuste');fig.tight_layout()
print("Conclusión: cada fila de R es una afirmación sobre los coeficientes y r dice qué valor debe cumplir. MCO restringido busca el mejor ajuste entre los coeficientes que cumplen todas esas afirmaciones. F mide cuánto se pierde frente al ajuste libre, teniendo en cuenta la incertidumbre y la covarianza. No suma pruebas t independientes.")`
},
{
id:"a6-rating",title:"06 Clase 6 · ¿El rating agrega información a los fundamentos?",
description:"Slides 57–63. Ejemplo sintético inspirado en la aplicación de ratings. Distingue asociación por separado, aporte del rating después de controlar fundamentos y aporte conjunto de los fundamentos después del rating.",
parameters:String.raw`n,aporte_rating,aporte_macro,sigma,alpha=200,.35,.20,.7,.05`,
code:A6_BASE+A6_MCO+String.raw`validar(n,alpha)
if sigma<=0: raise ValueError("Usa sigma>0.")
Z=rng.normal(size=(n,3));senial_extra=rng.normal(size=n)
# Rating continuo estilizado: mayor valor = mayor riesgo. No usa la escala real de las slides.
peso=np.array([.8,-.6,.5]);rating=Z@peso+senial_extra
logspread=1+aporte_macro*(Z@peso)+aporte_rating*rating+rng.normal(0,sigma,n)
X=np.column_stack([np.ones(n),Z,rating]);y=logspread
fit,_,_,Fr,pr=restringir(X,y,[[0,0,0,0,1]],[0])
_,_,_,Fm,pm=restringir(X,y,np.eye(5)[1:4],np.zeros(3))
solo=mco(np.column_stack([np.ones(n),rating]),y);p_solo=2*t.sf(abs(solo['b'][1]/np.sqrt(solo['V'][1,1])),solo['df'])
print("DATOS SIMULADOS: no reproduce estimaciones de países ni mide un efecto causal.")
print(f"Rating por separado: p={p_solo:.6g}")
print(f"Rating adicional a fundamentos: F(1,{fit['df']})={Fr:.4f}; p={pr:.6g}")
print(f"Fundamentos adicionales al rating: F(3,{fit['df']})={Fm:.4f}; p={pm:.6g}")
print("Prueba aporte_rating=0 y aporte_macro=.8: el rating puede asociarse con el spread porque resume fundamentos, sin aportar información adicional.")
labels=['Solo rating','Rating | fundamentos','Fundamentos | rating'];vals=[p_solo,pr,pm]
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
ax[0].scatter(rating,logspread,s=13,alpha=.4);ax[0].set(xlabel='Rating sintético de riesgo',ylabel='Log-spread sintético',title='La asociación bruta no responde todo')
ax[1].scatter(np.maximum(vals,np.finfo(float).tiny),np.arange(len(labels)),s=60);ax[1].set_xscale('log');ax[1].axvline(alpha,color='C1',ls='--');ax[1].set(yticks=np.arange(len(labels)),yticklabels=labels,xlabel='Valor p (escala log)',title='¿Qué información queda al controlar?');fig.tight_layout()
print("Conclusión: una variable puede predecir y por separado porque resume información que ya contienen otras variables. La prueba de aporte adicional pregunta si aún queda información después de incluirlas. Probar si el rating agrega algo y probar si los fundamentos agregan algo son dos preguntas diferentes. Rechazar una exclusión no demuestra causalidad ni garantiza mejorar predicciones fuera de la muestra.")`
},
{
id:"a6-solow",title:"07 Clase 6 · Solow: restricciones débiles y fuertes de la teoría",
description:"Slides 64–72. Países simulados. Compara coeficientes de signos opuestos con la restricción más fuerte alpha=1/3. En modo ampliado añade capital humano y contrasta que la suma de las tres pendientes sea cero.",
parameters:String.raw`modelo="basico"  # "basico" o "ampliado"
n,alpha_K,alpha_H,desvio,sigma,nivel=98,.40,.20,0.0,.35,.05
# desvio cambia SOLO el coeficiente de ln(n_poblacion+g+delta).
# alpha_K y alpha_H son participaciones tecnológicas; nivel es la significancia.`,
code:A6_BASE+A6_MCO+String.raw`validar(n,nivel)
if modelo not in ['basico','ampliado'] or not 0<alpha_K<1 or not 0<=alpha_H<1-alpha_K or sigma<=0: raise ValueError("Revisa modelo, sigma y participaciones: alpha_K>0, alpha_H>=0, suma<1.")
ls=rng.uniform(np.log(.08),np.log(.4),n);lng=rng.uniform(np.log(.055),np.log(.09),n)
if modelo=='basico':
    X=np.column_stack([np.ones(n),ls,lng]);a=alpha_K/(1-alpha_K);verdad=np.array([5.,a,-a+desvio])
    R=np.array([[0.,1,1]]);nombres=['constante','ln(s)','ln(n+g+delta)']
else:
    lh=rng.uniform(np.log(.03),np.log(.25),n);den=1-alpha_K-alpha_H
    X=np.column_stack([np.ones(n),ls,lng,lh]);verdad=np.array([5.,alpha_K/den,-(alpha_K+alpha_H)/den+desvio,alpha_H/den])
    R=np.array([[0.,1,1,1]]);nombres=['constante','ln(s_K)','ln(n+g+delta)','ln(s_H)']
y=X@verdad+rng.normal(0,sigma,n)
fit,br,rssr,F,pvalor=restringir(X,y,R,[0.])
print("Países SIMULADOS, no son los datos originales de MRW.")
print(pd.DataFrame({'verdad':verdad,'libre':fit['b'],'restringido':br},index=nombres).round(5))
print(f"H0 débil: suma de pendientes=0; suma verdadera={float((R@verdad)[0]):.4f}; F={F:.4f}, p={pvalor:.5f}")
labels=['Suma = 0'];ps=[pvalor]
if modelo=='basico':
    _,_,_,Ff,pf=restringir(X,y,[[0,1,0],[0,0,1]],[.5,-.5])
    labels.append('alpha = 1/3');ps.append(pf)
    denom=1+br[1];implied=br[1]/denom if abs(denom)>1e-10 else np.nan
    print(f"H0 fuerte: pendientes=(.5,−.5); F={Ff:.4f}, p={pf:.5f}; alpha implícita restringida={implied:.4f}")
else:
    denom=1+br[1]+br[3];imp=br[[1,3]]/denom if abs(denom)>1e-10 else np.array([np.nan,np.nan])
    print("Participaciones K,H implícitas en el modelo restringido:",imp)
    print("La igualdad no impone automáticamente participaciones positivas o económicamente admisibles.")
fig,ax=plt.subplots(1,2,figsize=(11,4.5));j=np.arange(1,len(verdad))
ax[0].bar(j-.18,fit['b'][1:],.36,label='Libre');ax[0].bar(j+.18,br[1:],.36,label='Restringido');ax[0].axhline(0,color='gray');ax[0].set(xticks=j,xticklabels=nombres[1:],ylabel='Pendiente',title='La teoría vincula varios coeficientes');ax[0].legend(fontsize=8)
ax[1].bar(labels,ps);ax[1].axhline(nivel,color='C1',ls='--',label='Nivel elegido');ax[1].set(ylabel='Valor p',ylim=(0,1),title='Compatible con una igualdad no prueba toda la teoría');ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: tener pendientes que se compensan es una afirmación más débil que fijar su tamaño. Podemos no rechazar la primera y rechazar la segunda. Cambia desvio para romper la igualdad; en el modelo ampliado el capital humano también entra en la suma. No rechazar restricciones solo indica compatibilidad con esta muestra y estos supuestos, no que toda la teoría sea verdadera.")`
},
{
id:"a6-lm",title:"08 Clase 6 · LM: buscar información en los residuos restringidos",dataset:"crime1",
description:"Slides 77–80. Reproduce crime1: contrasta conjuntamente avgsen y tottime. Muestra la regresión auxiliar, LM=nR² y el error de usar residuos del modelo libre.",
parameters:String.raw`alpha=.05
excluir=["avgsen","tottime"]  # Se permite cambiar el bloque del modelo`,
code:A6_BASE+A6_MCO+String.raw`variables=['pcnv','ptime86','qemp86','avgsen','tottime']
if not 0<alpha<1 or not excluir or len(set(excluir))!=len(excluir) or not set(excluir)<=set(variables): raise ValueError("Revisa alpha y las variables del bloque.")
d=pd.read_csv('crime1.csv')[['narr86']+variables].dropna();y=d.narr86.to_numpy();n=len(d)
X=np.column_stack([np.ones(n),d[variables].to_numpy()]);R=np.eye(X.shape[1])[[1+variables.index(v) for v in excluir]];q=len(excluir)
fit,br,rssr,F,pF=restringir(X,y,R,np.zeros(q));er=y-X@br
aux=mco(X,er);aux_mal=mco(X,fit['e']);LM=n*aux['r2'];pLM=chi2.sf(LM,q)
identidad=n*q*F/(fit['df']+q*F)
print("crime1: narr86 cuenta arrestos en 1986; un arresto no equivale a una condena.")
print(f"n={n}; H0: coeficientes de {excluir} iguales a cero")
print(f"RSS restringida={rssr:.6f}; RSS libre={fit['rss']:.6f}")
print(f"R² auxiliar={aux['r2']:.7f}; LM=n*R²={LM:.5f}; p chi²({q})={pLM:.5f}")
print(f"F={F:.5f}, p F={pF:.5f}; identidad LM=n*q*F/(df+q*F)={identidad:.5f}")
print(f"Si usamos residuos LIBRES: R² auxiliar={aux_mal['r2']:.3g}; X'e máximo={np.max(abs(X.T@fit['e'])):.2e}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));g=np.linspace(.001,max(chi2.ppf(.995,q),LM*1.2),400)
ax[0].plot(g,chi2.pdf(g,q));ax[0].axvline(LM,color='C1',label='LM observado');ax[0].axvline(chi2.ppf(1-alpha,q),color='black',ls='--',label='Crítico asintótico')
ax[0].set(xlabel='LM',ylabel='Densidad bajo H0',title=f'¿Queda señal en el residuo? p={pLM:.3f}');ax[0].legend(fontsize=8)
ax[1].bar(['Residuos restringidos','Residuos libres'],[max(0,aux['r2']),max(0,aux_mal['r2'])]);ax[1].set(ylabel='R² de la regresión auxiliar',title='Los residuos libres ya son ortogonales a X');fig.tight_layout()
print("Conclusión:","rechazamos la exclusión conjunta con LM al nivel elegido." if pLM<alpha else "LM no encuentra evidencia suficiente para rechazar la exclusión conjunta al nivel elegido.")
print("LM busca si las variables excluidas explican algo que dejó sin explicar el modelo restringido. Usar los residuos del modelo libre anula esa búsqueda: MCO ya los hizo ortogonales a X. No rechazar no prueba ausencia de efecto. Este LM clásico usa homocedasticidad y una referencia chi² asintótica; la aplicación reproduce las slides, sin demostrar que esos supuestos se cumplan ni identificar efectos causales.")`
},
{
id:"a6-lm-f",title:"09 Clase 6 · F y LM: misma pregunta, distinta aproximación",
description:"Slides 73–80. Bajo H0, compara rechazos de F y LM al aumentar n. Cambia el error de normal a asimétrico. F es exacta con normalidad; la referencia chi² de LM es asintótica. La simulación conserva exogeneidad y homocedasticidad.",
parameters:String.raw`tamanos=[20,60,250,1000]
B,q,alpha=1500,3,.05
error="normal"  # "normal" o "asimetrico"`,
code:A6_BASE+String.raw`if error not in ['normal','asimetrico'] or not isinstance(B,int) or not 100<=B<=5000 or not isinstance(q,int) or not 1<=q<=8 or not 0<alpha<1 or not tamanos or len(tamanos)>6 or len(set(tamanos))!=len(tamanos) or any(not isinstance(n,int) or n<=q+3 or n>2000 or n*B>3000000 for n in tamanos): raise ValueError("Revisa tamaños distintos, n>q+3, n<=2000, B (100–5000), q (1–8), n*B<=3 millones, alpha y error.")
tasas=[];diferencias=[];discrepancias=[]
for n in tamanos:
    Xr=np.column_stack([np.ones(n),rng.normal(size=n)]);X=np.column_stack([Xr,rng.normal(size=(n,q))]);df=n-X.shape[1]
    Qr=np.linalg.qr(Xr,mode='reduced')[0];Q=np.linalg.qr(X,mode='reduced')[0]
    u=rng.normal(size=(n,B)) if error=='normal' else rng.exponential(size=(n,B))-1
    Y=(1+Xr[:,1])[:,None]+u  # H0 verdadera: todas las q pendientes adicionales son cero.
    rssr=np.sum((Y-Qr@(Qr.T@Y))**2,axis=0);rssu=np.sum((Y-Q@(Q.T@Y))**2,axis=0)
    ganancia=np.maximum(rssr-rssu,0);Fs=(ganancia/q)/(rssu/df);LMs=n*ganancia/rssr
    pF=f.sf(Fs,q,df);pLM=chi2.sf(LMs,q)
    tasas.append([np.mean(pF<alpha),np.mean(pLM<alpha)]);diferencias.append(np.mean(abs(pF-pLM)));discrepancias.append(np.mean((pF<alpha)!=(pLM<alpha)))
    print(f"n={n:4d}: rechazo F={tasas[-1][0]:.3f}; LM={tasas[-1][1]:.3f}; decisiones distintas={discrepancias[-1]:.3f}; diferencia media de p={diferencias[-1]:.5f}")
    assert np.allclose(LMs,n*q*Fs/(df+q*Fs))
print(f"Referencia de variabilidad Monte Carlo de una tasa cercana a alpha: SE≈{np.sqrt(alpha*(1-alpha)/B):.4f}.")
tasas=np.array(tasas);fig,ax=plt.subplots(1,2,figsize=(10,4.5))
for j,label in enumerate(['F','LM con chi²']): ax[0].plot(tamanos,tasas[:,j],'o-',label=label)
ax[0].axhline(alpha,color='black',ls='--',label='Nivel nominal');ax[0].set(xlabel='n',ylabel='Proporción de rechazos bajo H0',title=f'Error {error}: calibración de las pruebas');ax[0].legend(fontsize=8)
ax[1].plot(tamanos,diferencias,'o-');ax[1].set(xlabel='n',ylabel='Media de |p F − p LM|',title='Las referencias se acercan con más datos');fig.tight_layout()
print("Conclusión: F y LM contrastan la misma exclusión, pero no son el mismo número ni tienen idénticos valores p en muestras pequeñas. LM se aproxima a q*F cuando n crece, con q fijo. La prueba F es exacta aquí solo con errores normales; con errores asimétricos ambas referencias se justifican asintóticamente. El error tiene media cero, varianza constante y es independiente de X en ambos escenarios: abandonar normalidad no es introducir endogeneidad. Las tasas simuladas fluctúan; no deben coincidir exactamente con alpha.")`
}
];
A6_LABS.forEach(example=>{
  example.code=A6_BASE+"\n# PARÁMETROS QUE PUEDES CAMBIAR\n"+example.parameters+"\n\n"+example.code.slice(A6_BASE.length);
  ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",classNumber:6,filename:example.title+".py"});
});
