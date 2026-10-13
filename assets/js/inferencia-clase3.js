// Clase 3: respuesta binaria. Datos sintéticos; cada bloque es independiente.
const IC3_BASE = String.raw`import numpy as np
import matplotlib.pyplot as plt
from scipy.special import expit
from scipy.stats import norm, chi2
from scipy.optimize import minimize
rng=np.random.default_rng(123)
np.set_printoptions(precision=3,suppress=True)
`;
const IC3_FIT = String.raw`
def estimar(X,y,modelo="logit"):
    if modelo not in ("logit","probit"): raise ValueError("Usa logit o probit.")
    if np.linalg.matrix_rank(X)<X.shape[1] or len(np.unique(y))<2:
        raise ValueError("Se necesitan ambas respuestas y columnas sin colinealidad.")
    def objetivo(b):
        t=X@b
        if modelo=="logit": return np.sum(np.logaddexp(0,t)-y*t)
        return -np.sum(y*norm.logcdf(t)+(1-y)*norm.logsf(t))
    def gradiente(b):
        t=X@b
        if modelo=="logit": return X.T@(expit(t)-y)
        score=y*np.exp(norm.logpdf(t)-norm.logcdf(t))-(1-y)*np.exp(norm.logpdf(t)-norm.logsf(t))
        return -X.T@score
    ajuste=minimize(objetivo,np.zeros(X.shape[1]),jac=gradiente,method="BFGS",options={"gtol":1e-6,"maxiter":500})
    if (not ajuste.success and np.max(np.abs(gradiente(ajuste.x)))>1e-4) or np.max(np.abs(ajuste.x))>30:
        raise ValueError("No hay una solución estable. Revisa separación perfecta o valores extremos.")
    return ajuste.x,-objetivo(ajuste.x)
def prob(X,b,modelo="logit"):
    return expit(X@b) if modelo=="logit" else norm.cdf(X@b)
def datos(n=1500):
    # Variables ficticias: educación centrada en 12 años, hijos y pareja.
    if not 50<=n<=20000: raise ValueError("Usa 50<=n<=20000.")
    educ=rng.uniform(8,20,n); hijos=rng.poisson(1.2,n); pareja=rng.binomial(1,.55,n)
    X=np.column_stack([np.ones(n),educ-12,hijos,pareja])
    verdad=np.array([-.5,.30,-.55,.4]); p=expit(X@verdad)
    return X,rng.binomial(1,p),p,verdad
`;
const IC3_LABS = [
{
id:"ic3-latente",title:"01 Clase 3 · De una decisión latente a trabajar o no",
description:"Slides 2–5. Cambia modelo, intercepto o pendiente. El deseo latente se observa solo como sí/no; la escala del error se fija para identificar el modelo.",
code:IC3_BASE+String.raw`n=2000; modelo="probit"; intercepto=-.5; pendiente=1.2
if modelo not in ("logit","probit") or not 50<=n<=20000: raise ValueError("Revisa modelo y n.")
x=rng.uniform(-3,3,n)
u=rng.normal(size=n) if modelo=="probit" else rng.logistic(size=n)
latente=intercepto+pendiente*x+u; y=(latente>0).astype(int)
grid=np.linspace(-3,3,200); indice=intercepto+pendiente*grid
p=norm.cdf(indice) if modelo=="probit" else expit(indice)
print("Primeras filas [x, deseo latente, trabaja]:\n",np.column_stack([x,latente,y])[:10])
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].scatter(x,latente,c=y,s=8,alpha=.3);ax[0].axhline(0,color="black")
ax[0].set(xlabel="x",ylabel="Deseo latente",title="El umbral convierte deseo en decisión")
ax[1].scatter(x,y,s=5,alpha=.08);ax[1].plot(grid,p,color="C1")
ax[1].set(xlabel="x",ylabel="P(trabajar | x)",title=modelo,ylim=(-.05,1.05));fig.tight_layout()
print("Conclusión: personas con el mismo x pueden tomar decisiones diferentes por factores no observados. Logit y probit traducen el índice latente a probabilidades entre cero y uno; no observamos directamente ese deseo.")`
},
{
id:"ic3-mpl",title:"02 Clase 3 · Modelo lineal: probabilidades imposibles",
description:"Slides 2 y 22. Contrasta una recta con una probabilidad en S. La varianza de un resultado Bernoulli depende de p: el modelo lineal suele ser heterocedástico.",
code:IC3_BASE+String.raw`n=2000; pendiente=2.0
x=rng.uniform(-3,3,n); p=expit(-.4+pendiente*x); y=rng.binomial(1,p)
X=np.column_stack([np.ones(n),x]); b=np.linalg.lstsq(X,y,rcond=None)[0]; ajustada=X@b
grid=np.linspace(-3,3,200); pg=expit(-.4+pendiente*grid)
print("MCO [constante, pendiente]:",b)
print("Fracción de predicciones fuera de [0,1]:",np.mean((ajustada<0)|(ajustada>1)))
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].plot(grid,pg,label="Probabilidad verdadera");ax[0].plot(grid,b[0]+b[1]*grid,label="MCO")
ax[0].axhline(0,color="gray",ls="--");ax[0].axhline(1,color="gray",ls="--");ax[0].legend()
ax[0].set(xlabel="x",ylabel="Probabilidad",title="Una recta no tiene límites naturales")
ax[1].plot(grid,pg*(1-pg));ax[1].set(xlabel="x",ylabel="Var(Y|x)=p(1-p)",title="Mayor incertidumbre cerca de p=0.5")
fig.tight_layout()
print("Conclusión: una recta puede aproximar probabilidades en una zona, pero puede salir de [0,1] y supone un cambio constante. Su incertidumbre no es constante: es mayor donde sí y no son igualmente probables. Recortar predicciones no corrige el modelo.")`
},
{
id:"ic3-verosimilitud",title:"03 Clase 3 · Máxima verosimilitud: qué p explica los datos",
description:"Slides 6–9. Edita la lista de ceros y unos de la slide 8. Compara el producto de probabilidades con la suma de sus logaritmos.",
code:IC3_BASE+String.raw`y=np.array([1,1,1,0])  # CAMBIA resultados observados
if len(y)==0 or not np.all(np.isin(y,[0,1])): raise ValueError("Usa ceros y unos.")
grid=np.linspace(.001,.999,500); exitos=y.sum(); n=len(y)
ll=exitos*np.log(grid)+(n-exitos)*np.log1p(-grid); phat=y.mean()
print(f"Éxitos={exitos}/{n}; p que maximiza la verosimilitud={phat:.3f}")
for p in [.50,.75,.95]: print(f"p={p:.2f}: L={p**exitos*(1-p)**(n-exitos):.5f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].plot(grid,np.exp(ll));ax[0].set(xlabel="p",ylabel="L(p)",title="Probabilidad de la secuencia observada")
ax[1].plot(grid,ll);ax[1].set(xlabel="p",ylabel="log L(p)",title="Mismo máximo, cálculo más estable")
for a in ax: a.axvline(phat,color="C1",ls="--")
fig.tight_layout()
print("Conclusión: con tres sí y un no, p=0.75 hace más probable esa secuencia que p=0.95. La verosimilitud no es la probabilidad de que un parámetro sea verdadero. Si todos son sí o todos no, el máximo está en el borde: un logit con solo constante no tiene coeficiente finito.")`
},
{
id:"ic3-comparacion",title:"04 Clase 3 · Estimar y comparar MCO, logit y probit",
description:"Slides 9 y 20–22. Misma muestra para los tres modelos. Compara probabilidades, no directamente coeficientes de índices con escalas distintas.",
code:IC3_BASE+IC3_FIT+String.raw`n=1500; x=rng.uniform(-3,3,n); X=np.column_stack([np.ones(n),x])
p=expit(-.5+1.4*x); y=rng.binomial(1,p)
grid=np.linspace(-3,3,200); G=np.column_stack([np.ones(len(grid)),grid])
fig,ax=plt.subplots(figsize=(8,4));ax.plot(grid,expit(-.5+1.4*grid),color="black",ls="--",label="Verdad")
b_mco=np.linalg.lstsq(X,y,rcond=None)[0];ax.plot(grid,G@b_mco,label="MCO")
print("MCO:",b_mco)
for modelo in ["logit","probit"]:
    b,ll=estimar(X,y,modelo);ax.plot(grid,prob(G,b,modelo),label=modelo)
    print(modelo,"coeficientes:",b,"; log-verosimilitud:",round(ll,2))
ax.set(xlabel="x",ylabel="Probabilidad",title="Distintos índices, probabilidades parecidas");ax.legend();fig.tight_layout()
print("Conclusión: logit y probit pueden predecir casi lo mismo aunque sus coeficientes difieran por la escala del error. El signo y los efectos pueden parecerse en este ejemplo; no es una garantía universal para cualquier muestra o especificación. Un buen ajuste no establece causalidad.")`
},
{
id:"ic3-marginal",title:"05 Clase 3 · Efecto marginal: AME no es efecto en la media",
description:"Slides 10–15. Modifica modelo y compara el cambio por un año de educación en cada persona, su promedio (AME) y el cambio en las características medias (MEM).",
code:IC3_BASE+IC3_FIT+String.raw`modelo="probit"; X,y,p,verdad=datos(); b,ll=estimar(X,y,modelo)
indice=X@b; F=prob(X,b,modelo)
densidad=F*(1-F) if modelo=="logit" else norm.pdf(indice)
me=densidad*b[1]; media=X.mean(axis=0); pm=prob(media,b,modelo)
mem=(pm*(1-pm) if modelo=="logit" else norm.pdf(media@b))*b[1]
paso=.0001; arriba=X.copy();abajo=X.copy();arriba[:,1]+=paso;abajo[:,1]-=paso
numerico=(prob(arriba,b,modelo)-prob(abajo,b,modelo))/(2*paso)
print(f"Beta educación={b[1]:.3f}; AME={100*me.mean():.2f} pp/año; MEM={100*mem:.2f} pp/año")
print("Error máximo al comprobar derivada numérica:",np.max(abs(me-numerico)))
fig,ax=plt.subplots(figsize=(8,4));ax.scatter(F,100*me,s=8,alpha=.2)
ax.axhline(100*me.mean(),label="AME",color="C1");ax.axhline(100*mem,label="MEM",color="C2",ls="--")
ax.set(xlabel="Probabilidad predicha",ylabel="Efecto marginal (puntos porcentuales/año)",title="La misma pendiente del índice no da el mismo cambio en p");ax.legend();fig.tight_layout()
print("Conclusión: una persona cerca de 50% suele tener más margen de cambio que otra cerca de 0% o 100%. AME promedia cambios individuales; MEM evalúa una persona con características medias, que puede no existir. La derivada es un cambio local, no necesariamente el cambio exacto por un año completo.")`
},
{
id:"ic3-discreto",title:"06 Clase 3 · Variable binaria: cambiar de cero a uno",
description:"Slides 10–19. Para pareja no calculamos una derivada: comparamos la predicción con pareja=1 y pareja=0, manteniendo las demás características.",
code:IC3_BASE+IC3_FIT+String.raw`modelo="logit"; X,y,p,verdad=datos(); b,ll=estimar(X,y,modelo)
X0=X.copy();X1=X.copy();X0[:,3]=0;X1[:,3]=1
p0=prob(X0,b,modelo);p1=prob(X1,b,modelo);cambio=p1-p0
print("Coeficiente pareja:",b[3],"; cambio discreto promedio en pp:",100*cambio.mean())
print("Primeras 8 filas [p sin pareja, p con pareja, diferencia]:\n",np.column_stack([p0,p1,cambio])[:8])
fig,ax=plt.subplots(figsize=(8,4));ax.scatter(p0,100*cambio,s=8,alpha=.25)
ax.axhline(100*cambio.mean(),color="C1",label="Cambio promedio")
ax.set(xlabel="Probabilidad con pareja=0",ylabel="Cambio 0→1 (puntos porcentuales)",title="Un salto completo, no un cambio infinitesimal");ax.legend();fig.tight_layout()
print("Conclusión: estar o no en pareja es un salto, no una variable que aumente un poquito. Comparamos dos predicciones para cada perfil. Esta comparación del modelo no demuestra que formar pareja cause ese cambio: se necesitan supuestos de identificación.")`
},
{
id:"ic3-perfiles",title:"07 Clase 3 · Predecir para personas y para el promedio",
description:"Slides 16–19. Cambia educación, hijos y pareja del perfil. Distingue promedio de probabilidades y probabilidad en las medias.",
code:IC3_BASE+IC3_FIT+String.raw`educacion=16; hijos=1; pareja=0; modelo="logit"
if pareja not in [0,1] or hijos<0: raise ValueError("Pareja debe ser 0/1; hijos no negativo.")
X,y,p,verdad=datos();b,ll=estimar(X,y,modelo)
perfil=np.array([1,educacion-12,hijos,pareja]); promedio=prob(X,b,modelo).mean(); en_media=prob(X.mean(axis=0),b,modelo)
print(f"Perfil elegido={prob(perfil,b,modelo):.3f}; promedio de probabilidades={promedio:.3f}; probabilidad en medias={en_media:.3f}")
grid=np.linspace(8,20,100); G=np.column_stack([np.ones(100),grid-12,np.full(100,hijos),np.full(100,pareja)])
fig,ax=plt.subplots(figsize=(8,4));ax.plot(grid,prob(G,b,modelo));ax.scatter([educacion],[prob(perfil,b,modelo)],color="C1")
ax.axhline(promedio,color="gray",ls="--",label="Promedio de la muestra")
ax.set(xlabel="Educación (años)",ylabel="P(trabajar)",ylim=(0,1),title=f"Perfil: hijos={hijos}, pareja={pareja}");ax.legend();fig.tight_layout()
print("Conclusión: la predicción depende de a quién describimos. En una función no lineal, predecir primero y promediar después no equivale a predecir para las características medias. Alejarse del rango observado implica extrapolar.")`
},
{
id:"ic3-odds",title:"08 Clase 3 · Odds ratio no es cambio en probabilidad",
description:"Complemento de logit. Un mismo multiplicador de odds produce cambios distintos en probabilidad según el punto de partida.",
code:IC3_BASE+String.raw`beta=.7; cambio_x=1
p0=np.linspace(.01,.99,200); multiplicador=np.exp(beta*cambio_x)
p1=multiplicador*p0/(1-p0+multiplicador*p0)
print(f"Odds ratio=exp(beta*Δx)={multiplicador:.3f}")
for p in [.1,.5,.9]:
    nueva=multiplicador*p/(1-p+multiplicador*p)
    print(f"p inicial={p:.2f}; p nueva={nueva:.3f}; cambio={100*(nueva-p):.1f} pp")
fig,ax=plt.subplots(figsize=(8,4));ax.plot(p0,100*(p1-p0))
ax.set(xlabel="Probabilidad inicial",ylabel="Cambio (puntos porcentuales)",title="Multiplicar odds no multiplica probabilidades");fig.tight_layout()
print("Conclusión: odds=p/(1-p) compara la probabilidad de sí con la de no. Duplicar odds no duplica la probabilidad y tampoco suma una cantidad fija de puntos porcentuales.")`
},
{
id:"ic3-ajuste",title:"09 Clase 3 · Pseudo-R², AIC y BIC: ajuste contra complejidad",
description:"Slides 23–26. Compara sobre la misma muestra un modelo nulo, uno incompleto, uno correcto y uno con controles irrelevantes; evalúa también una muestra independiente.",
code:IC3_BASE+IC3_FIT+String.raw`n=600; irrelevantes=8
if not 0<=irrelevantes<=20: raise ValueError("Usa de 0 a 20 variables extra.")
X,y,p,verdad=datos(n); Xt,yt,pt,_=datos(3000)
ruido=rng.normal(size=(n,irrelevantes));ruidot=rng.normal(size=(len(yt),irrelevantes))
modelos=[("Constante",X[:,:1],Xt[:,:1]),("Solo educación",X[:,:2],Xt[:,:2]),("Completo",X,Xt),("Más ruido",np.column_stack([X,ruido]),np.column_stack([Xt,ruidot]))]
ll0=np.sum(y*np.log(y.mean())+(1-y)*np.log1p(-y.mean()))
tabla=[]
for nombre,A,T in modelos:
    b,ll=estimar(A,y);k=A.shape[1]; pred=np.clip(prob(T,b),1e-12,1-1e-12)
    perdida=-np.mean(yt*np.log(pred)+(1-yt)*np.log1p(-pred))
    fila=[1-ll/ll0,2*k-2*ll,k*np.log(n)-2*ll,perdida];tabla.append(fila)
    print(nombre,"[pseudo-R2,AIC,BIC,log-loss test]:",np.round(fila,3))
tabla=np.array(tabla); nombres=[v[0] for v in modelos]
fig,ax=plt.subplots(1,2,figsize=(11,4));ax[0].plot(nombres,tabla[:,1],"o-",label="AIC");ax[0].plot(nombres,tabla[:,2],"o-",label="BIC");ax[0].legend()
ax[0].set(ylabel="Menor es mejor",title="Penalizar parámetros innecesarios")
ax[1].bar(nombres,tabla[:,3]);ax[1].set(ylabel="Log-loss: menor es mejor",title="Predicción en personas nuevas")
for a in ax: a.tick_params(axis="x",labelrotation=20)
fig.tight_layout()
print("Conclusión: añadir variables puede mejorar el ajuste dentro de la muestra sin mejorar predicciones nuevas. AIC y BIC penalizan complejidad; no siempre eligen lo mismo ni garantizan ganar fuera de muestra. Pseudo-R² no es porcentaje de varianza explicada y no tiene un umbral universal de buen modelo.")`
},
{
id:"ic3-hl",title:"10 Clase 3 · Calibración y Hosmer–Lemeshow",
description:"Slides 27–28. Omite o incluye una curvatura real; contrasta eventos observados y esperados por grupos de riesgo. El p-valor es una aproximación, no un certificado.",
code:IC3_BASE+IC3_FIT+String.raw`n=2000; curvatura=1.0; incluir_cuadrado=False; grupos=10
if not 3<=grupos<=20: raise ValueError("Usa entre 3 y 20 grupos.")
x=rng.uniform(-2,2,n);y=rng.binomial(1,expit(-1+.8*x+curvatura*x*x))
X=np.column_stack([np.ones(n),x,x*x]) if incluir_cuadrado else np.column_stack([np.ones(n),x])
b,ll=estimar(X,y);p=prob(X,b); particiones=np.array_split(np.argsort(p),grupos)
observados=[];esperados=[];H=0
for ids in particiones:
    N=len(ids); E=p[ids].sum(); O=y[ids].sum()
    if min(E,N-E)<5: print("Aviso: pocos eventos/no eventos esperados; aproximación HL poco fiable.")
    H+=(O-E)**2/(E*(1-E/N));observados.append(O/N);esperados.append(E/N)
print(f"HL={H:.2f}; grados de libertad aproximados={grupos-2}; p-valor={chi2.sf(H,grupos-2):.4f}")
print("Por grupo [predicho, observado]:\n",np.column_stack([esperados,observados]))
fig,ax=plt.subplots(figsize=(6,5));ax.plot([0,1],[0,1],"--",color="gray");ax.plot(esperados,observados,"o-")
ax.set(xlabel="Proporción predicha",ylabel="Proporción observada",xlim=(0,1),ylim=(0,1),title="Calibración: acercarse a la diagonal");fig.tight_layout()
print("Conclusión: si asignas 30% a un grupo, esperas aproximadamente 30 sí por cada 100 personas. HL busca discrepancias agrupadas; depende del tamaño de muestra y de cómo agrupas. No rechazar no prueba que el modelo sea correcto ni causal; también conviene validar en datos nuevos.")`
},
{
id:"ic3-clasificacion",title:"11 Clase 3 · Punto de corte y errores de clasificación",
description:"Slides 29–30. Entrena con una muestra y evalúa otra. Cambia el corte: disminuirlo detecta más sí, pero genera más falsas alarmas.",
code:IC3_BASE+IC3_FIT+String.raw`corte=.5
if not 0<corte<1: raise ValueError("Usa un corte entre cero y uno.")
X,y,p,_=datos();b,ll=estimar(X,y);T,yt,pt,_=datos(2500);pred=prob(T,b)
def metricas(c):
    decision=pred>=c; TP=np.sum(decision&(yt==1));FP=np.sum(decision&(yt==0));FN=np.sum(~decision&(yt==1));TN=np.sum(~decision&(yt==0))
    return np.array([[TN,FP],[FN,TP]]),TP/(TP+FN),TN/(TN+FP)
matriz,sens,esp=metricas(corte)
print("Matriz: filas=real [0,1], columnas=predicho [0,1]\n",matriz)
print(f"Sensibilidad={sens:.3f}; especificidad={esp:.3f}; exactitud={np.trace(matriz)/len(yt):.3f}")
print("Exactitud de predecir siempre la clase mayoritaria:",max(yt.mean(),1-yt.mean()))
grid=np.linspace(.01,.99,99); M=np.array([metricas(c)[1:] for c in grid])
fig,ax=plt.subplots(1,2,figsize=(10,4));ax[0].imshow(matriz,cmap="Blues")
for i in range(2):
    for j in range(2): ax[0].text(j,i,str(matriz[i,j]),ha="center",va="center",color="black",bbox=dict(facecolor="white",alpha=.7))
ax[0].set(xticks=[0,1],yticks=[0,1],xlabel="Predicho",ylabel="Real",title=f"Corte={corte}")
ax[1].plot(grid,M[:,0],label="Sensibilidad");ax[1].plot(grid,M[:,1],label="Especificidad");ax[1].axvline(corte,color="gray",ls="--")
ax[1].set(xlabel="Punto de corte",ylabel="Proporción",ylim=(0,1),title="El corte cambia los errores, no el modelo");ax[1].legend();fig.tight_layout()
print("Conclusión: bajar el corte permite detectar más positivos a costa de más falsas alarmas. No existe un 0.5 óptimo para todo: depende del costo de cada error. Clasificar bien y dar probabilidades bien calibradas son propiedades distintas.")`
},
{
id:"ic3-causalidad",title:"12 Clase 3 · Predecir no es identificar un efecto causal",
description:"Complemento causal. Educación y habilidad comparten variación. Compara logit omitiendo habilidad con un modelo ideal que puede observarla; solo el simulador conoce el mecanismo real.",
code:IC3_BASE+IC3_FIT+String.raw`n=6000; beta=.5; gamma=1.2; correlacion=.7
if not -1<correlacion<1: raise ValueError("Usa -1<correlacion<1.")
h=rng.normal(size=n);x=correlacion*h+np.sqrt(1-correlacion**2)*rng.normal(size=n)
p=expit(-.5+beta*x+gamma*h);y=rng.binomial(1,p)
X=np.column_stack([np.ones(n),x]);Z=np.column_stack([X,h])
bc,_=estimar(X,y);bl,_=estimar(Z,y)
pc=prob(X,bc);pl=prob(Z,bl)
ame_verdad=np.mean(beta*p*(1-p));ame_corto=np.mean(bc[1]*pc*(1-pc));ame_largo=np.mean(bl[1]*pl*(1-pl))
print("Coeficientes de x: omitida=",bc[1],"; completa=",bl[1],"; verdad=",beta)
print("AME [verdad, omite habilidad, controla habilidad]:",[ame_verdad,ame_corto,ame_largo])
fig,ax=plt.subplots(figsize=(8,4));ax.bar(["Mecanismo verdadero","Omite habilidad","Controla habilidad"],100*np.array([ame_verdad,ame_corto,ame_largo]))
ax.set(ylabel="Cambio local promedio (pp/unidad x)",title="La forma en S no elimina la confusión");fig.tight_layout()
print("Conclusión: logit mantiene las predicciones entre cero y uno, pero no separa mágicamente educación de habilidad. Aquí controlar habilidad funciona porque conocemos el mecanismo y los supuestos por construcción. Compara efectos en probabilidades: los coeficientes logit entre modelos también pueden cambiar por no colapsabilidad, no solo por confusión.")`
}
];
IC3_LABS.forEach(example => ECON_PYTHON_EXAMPLES.push({
  ...example, course:"inferencia-causal", classNumber:3, filename:example.title+".py"
}));
