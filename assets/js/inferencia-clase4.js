// Clase 4: elección multinomial, salud ordenada y probit bivariado.
// Cada editor recibe un programa completo; no depende de ejecutar otros ejemplos.
window.ECON_IC4_DATA = {
  mus15: {filename:"mus15data.csv",url:document.currentScript.dataset.fishingUrl},
  mus18: {filename:"mus18data_year2.csv",url:document.currentScript.dataset.healthUrl}
};
const IC4_BASE=String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.special import softmax, logsumexp, expit
from scipy.optimize import minimize
from scipy.stats import norm, chi2
rng=np.random.default_rng(123)
np.set_printoptions(precision=5,suppress=True)
`;
const IC4_CHOICE=String.raw`
def probabilidades(Z,b):
    return softmax(Z@b,axis=1)
def estimar_eleccion(Z,y):
    # Z[i,j,k]: característica k de la alternativa j para la persona i.
    Z=np.asarray(Z,float);y=np.asarray(y,int);n,J,K=Z.shape
    if y.shape!=(n,) or not np.all(np.isfinite(Z)) or not np.all(np.isin(y,np.arange(J))):
        raise ValueError("Revisa dimensiones, categorías y valores finitos.")
    if np.linalg.matrix_rank((Z-Z[:,0:1,:]).reshape(-1,K))<K:
        raise ValueError("Hay parámetros no identificados: revisa categoría base y colinealidad.")
    elegido=Z[np.arange(n),y]
    def obj(b):
        v=Z@b;P=softmax(v,axis=1)
        return np.mean(logsumexp(v,axis=1)-v[np.arange(n),y]),np.mean(np.einsum('ij,ijk->ik',P,Z)-elegido,axis=0)
    fit=minimize(obj,np.zeros(K),jac=True,method="BFGS",options={"gtol":1e-8,"maxiter":400})
    if np.max(abs(obj(fit.x)[1]))>2e-6: raise ValueError("La estimación no convergió; revisa los datos.")
    b=fit.x;P=probabilidades(Z,b);media=np.einsum('ij,ijk->ik',P,Z)
    H=np.einsum('ij,ijk,ijl->kl',P,Z,Z)-media.T@media
    if np.linalg.eigvalsh(H).min()<=1e-9: raise ValueError("Información insuficiente para calcular SE fiables.")
    V=np.linalg.solve(H,np.eye(K))
    return b,np.sqrt(np.diag(V)),-n*obj(b)[0],P,V
def diseno_mnl(X,J=4,base=0):
    if not isinstance(base,int) or not 0<=base<J: raise ValueError("La base debe identificar una categoría existente.")
    libres=[j for j in range(J) if j!=base];Z=np.zeros((len(X),J,X.shape[1]*(J-1)))
    for k,j in enumerate(libres): Z[:,j,k*X.shape[1]:(k+1)*X.shape[1]]=X
    return Z,libres
def coef_mnl(b,K,J,base):
    beta=np.zeros((J,K));beta[[j for j in range(J) if j!=base]]=b.reshape(J-1,K)
    return beta
`;
const IC4_FISH=String.raw`
alternativas=["Playa","Muelle","Privado","Arrendado"]
sufijos=["beach","pier","private","charter"]
def pesca():
    d=pd.read_csv("mus15data.csv")
    y=d["mode"].to_numpy().astype(int)-1
    precios=d[["p"+s for s in sufijos]].to_numpy()
    tasas=d[["q"+s for s in sufijos]].to_numpy()
    if not np.all(d[["d"+s for s in sufijos]].sum(axis=1)==1): raise ValueError("Debe haber una elección por persona.")
    return d,y,precios,tasas
def diseno_pesca(precios,tasas,ingreso=None):
    # Precio en centenas de dólares: el coeficiente por dólar es b[0]/100.
    Z=np.stack([precios/100,tasas],axis=2)
    if ingreso is not None:
        M,_=diseno_mnl(np.column_stack([np.ones(len(ingreso)),ingreso]))
        Z=np.concatenate([Z,M],axis=2)
    return Z
`;
const IC4_HEALTH=String.raw`
salud_nombres=["Pobre/regular","Buena","Excelente"]
def salud():
    d=pd.read_csv("mus18data_year2.csv")
    pf=d.hlthp.to_numpy()+d.hlthf.to_numpy();buena=d.hlthg.to_numpy();excelente=1-pf-buena
    if not np.all(np.isin(np.column_stack([pf,buena,excelente]),[0,1])): raise ValueError("Las categorías de salud deben ser excluyentes.")
    y=np.argmax(np.column_stack([pf,buena,excelente]),axis=1)
    W=d[["age","linc","ndisease"]].to_numpy();centro=W.mean(axis=0);escala=np.array([10.,1.,1.])
    # Centramos para estabilidad; edad por década, ingreso en log, enfermedades en unidades.
    X=(W-centro)/escala
    return d,y,W,X,centro,escala
`;
const IC4_ORDER=String.raw`
def prob_ordenada(X,b,cortes):
    F=expit(cortes[None,:]-(X@b)[:,None])
    return np.column_stack([F[:,0],F[:,1]-F[:,0],1-F[:,1]])
def estimar_ordenado(X,y):
    # Sin intercepto: su nivel ya está representado por los umbrales.
    n,K=X.shape
    if np.linalg.matrix_rank(np.column_stack([np.ones(n),X]))!=K+1 or len(np.unique(y))!=3:
        raise ValueError("Usa tres categorías y regresores sin constante ni colinealidad.")
    def obj(t):
        b=t[:K];gap=np.exp(t[K+1]);c=np.array([t[K],t[K]+gap]);eta=X@b
        F=expit(c[None,:]-eta[:,None]);f=F*(1-F)
        P=np.column_stack([F[:,0],F[:,1]-F[:,0],1-F[:,1]])
        p=np.maximum(P[np.arange(n),y],1e-14)
        deta=np.column_stack([-f[:,0],f[:,0]-f[:,1],f[:,1]])[np.arange(n),y]
        dgap=np.column_stack([np.zeros(n),gap*f[:,1],-gap*f[:,1]])[np.arange(n),y]
        g=np.r_[-X.T@(deta/p)/n,np.mean(deta/p),-np.mean(dgap/p)]
        return -np.mean(np.log(p)),g
    c=np.log(np.cumsum(np.bincount(y,minlength=3))[:2]/n/(1-np.cumsum(np.bincount(y,minlength=3))[:2]/n))
    inicio=np.r_[np.zeros(K),c[0],np.log(c[1]-c[0])]
    fit=minimize(obj,inicio,jac=True,method="BFGS",options={"gtol":1e-8,"maxiter":400})
    if np.max(abs(obj(fit.x)[1]))>2e-6: raise ValueError("El logit ordenado no convergió.")
    b=fit.x[:K];cortes=np.array([fit.x[K],fit.x[K]+np.exp(fit.x[K+1])])
    return b,cortes,-n*obj(fit.x)[0],prob_ordenada(X,b,cortes)
`;
const IC4_BIV=String.raw`
def cdf_bivariada(a,b,rho,orden=40):
    # Integración determinista de Plackett: Phi(a)Phi(b) + integral de 0 a rho.
    # Evita que una CDF aleatoria cambie el objetivo entre iteraciones.
    a,b,rho=np.broadcast_arrays(a,b,rho)
    nodos,pesos=np.polynomial.legendre.leggauss(orden)
    t=rho[...,None]*(nodos+1)/2;den=1-t*t
    dens=np.exp(-(a[...,None]**2-2*t*a[...,None]*b[...,None]+b[...,None]**2)/(2*den))/(2*np.pi*np.sqrt(den))
    return np.clip(norm.cdf(a)*norm.cdf(b)+rho/2*np.sum(dens*pesos,axis=-1),0,1)
def prob_conjuntas(eta1,eta2,rho):
    p11=cdf_bivariada(eta1,eta2,rho);p1=norm.cdf(eta1);p2=norm.cdf(eta2)
    return np.column_stack([1-p1-p2+p11,p2-p11,p1-p11,p11])
def estimar_probit(X,y):
    def obj(b):
        q=2*y-1;t=q*(X@b)
        g=-(X.T@(q*np.exp(norm.logpdf(t)-norm.logcdf(t))))/len(y)
        return -np.mean(norm.logcdf(t)),g
    fit=minimize(obj,np.zeros(X.shape[1]),jac=True,method="BFGS",options={"gtol":1e-8,"maxiter":400})
    if np.max(abs(obj(fit.x)[1]))>2e-6: raise ValueError("El probit separado no convergió.")
    return fit.x,-len(y)*obj(fit.x)[0]
def estimar_biprobit(X,y1,y2,orden=40):
    n,K=X.shape;q1=2*y1-1;q2=2*y2-1
    if np.linalg.matrix_rank(X)<K or len(np.unique(y1))<2 or len(np.unique(y2))<2: raise ValueError("Revisa rango y ambas respuestas binarias.")
    b1,ll1=estimar_probit(X,y1);b2,ll2=estimar_probit(X,y2)
    def obj(t):
        rho=np.tanh(t[-1]);r=q1*q2*rho;a=q1*(X@t[:K]);b=q2*(X@t[K:2*K]);s=np.sqrt(1-r*r)
        p=np.maximum(cdf_bivariada(a,b,r,orden),1e-14)
        da=norm.pdf(a)*norm.cdf((b-r*a)/s);db=norm.pdf(b)*norm.cdf((a-r*b)/s)
        dr=np.exp(-(a*a-2*r*a*b+b*b)/(2*(1-r*r)))/(2*np.pi*s)
        g=-np.r_[X.T@(q1*da/p),X.T@(q2*db/p),np.sum(q1*q2*dr/p)*(1-rho*rho)]/n
        return -np.mean(np.log(p)),g
    fit=minimize(obj,np.r_[b1,b2,0.],jac=True,method="BFGS",options={"gtol":2e-7,"maxiter":180})
    rho=np.tanh(fit.x[-1])
    if np.max(abs(obj(fit.x)[1]))>2e-5 or abs(rho)>.98: raise ValueError("Solución inestable o correlación cercana al borde; revisa datos.")
    h=1e-4;E=np.eye(len(fit.x))*h
    H=n*np.column_stack([(obj(fit.x+e)[1]-obj(fit.x-e)[1])/(2*h) for e in E]);H=(H+H.T)/2
    if np.linalg.eigvalsh(H).min()<=0: raise ValueError("No se pudo calcular la incertidumbre del ajuste.")
    V=np.linalg.solve(H,np.eye(len(fit.x)))
    return fit.x[:K],fit.x[K:2*K],rho,-n*obj(fit.x)[0],V,b1,b2,ll1+ll2
`;
const IC4_LABS=[
{
id:"ic4-datos",title:"01 Clase 4 · Las alternativas de pesca",dataset:"mus15",
parameters:"persona=0  # Índice de persona: entre 0 y n-1",
description:"Slides 5–6. Explora mus15data y convierte la base a formato largo. Cada persona elige una de cuatro alternativas; ingreso está en miles de dólares mensuales.",
code:IC4_BASE+IC4_FISH+String.raw`d,y,precios,tasas=pesca()
if not isinstance(persona,int) or not 0<=persona<len(d): raise ValueError("Elige un índice de persona válido.")
long=pd.DataFrame({"id":np.repeat(np.arange(len(d)),4),"alternativa":np.tile(alternativas,len(d)),"elegida":(np.arange(4)[None,:]==y[:,None]).ravel(),"precio":precios.ravel(),"tasa_pesca":tasas.ravel(),"ingreso_miles":np.repeat(d.income.to_numpy(),4)})
cuenta=np.bincount(y,minlength=4)
print(f"Formato ancho: {len(d)} personas; largo: {len(long)} filas, cuatro por persona. No son cuatro veces más personas.")
print(long[long.id==persona].to_string(index=False))
print(pd.DataFrame({"elecciones":cuenta,"proporción":cuenta/len(d),"precio medio (todos)":precios.mean(axis=0),"tasa media (todos)":tasas.mean(axis=0)},index=alternativas).round(4))
print("Ingreso medio según modo elegido:\n",d.assign(modo=[alternativas[j] for j in y]).groupby("modo").income.mean())
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].bar(alternativas,cuenta/len(d));ax[0].set(ylabel="Proporción observada",title="¿Qué alternativa se elige?")
ax[1].bar(alternativas,precios[persona]);ax[1].set(ylabel="Precio (dólares)",title=f"Alternativas de la persona {persona}")
for eje in ax: eje.tick_params(axis="x",labelrotation=15)
fig.tight_layout()
print("Conclusión: observamos una decisión, pero también las opciones que cada persona pudo elegir. El ingreso se repite dentro de la persona; precio y tasa de pesca pueden variar por alternativa. Las diferencias entre quienes eligieron cada modo son descriptivas, no efectos causales.")`
},
{
id:"ic4-mnl",title:"02 Clase 4 · Logit multinomial: ingreso y elección",dataset:"mus15",
parameters:"ingreso_miles=4.0",
description:"Slides 12–18. Reproduce mlogit mode income con playa como base. Cambia ingreso_miles y compara sus cuatro probabilidades con las frecuencias observadas.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`d,y,precios,tasas=pesca();ingreso=d.income.to_numpy();X=np.column_stack([np.ones(len(d)),ingreso])
if not np.isfinite(ingreso_miles) or ingreso_miles<0: raise ValueError("Usa ingreso no negativo y finito.")
Z,libres=diseno_mnl(X);b,se,ll,P,V=estimar_eleccion(Z,y)
beta=coef_mnl(b,2,4,0)
print(pd.DataFrame({"coeficiente":b,"SE":se,"z":b/se},index=[a+" / "+v for a in alternativas[1:] for v in ["constante","ingreso (mil $)"]]).round(5))
personal=softmax(np.array([1.,ingreso_miles])@beta.T)
print(f"Ingreso mensual={ingreso_miles:g} miles de dólares; probabilidades:",dict(zip(alternativas,personal.round(4))))
print(f"Log-verosimilitud={ll:.4f}; máxima diferencia entre suma de probabilidades y 1={np.max(abs(P.sum(axis=1)-1)):.2e}")
g=np.linspace(ingreso.min(),ingreso.max(),150);pg=softmax(np.column_stack([np.ones(len(g)),g])@beta.T,axis=1)
fig,ax=plt.subplots(1,2,figsize=(10,4))
for j,nombre in enumerate(alternativas): ax[0].plot(g,pg[:,j],label=nombre)
ax[0].set(xlabel="Ingreso mensual (miles de dólares)",ylabel="Probabilidad",title="Cuatro curvas que suman uno");ax[0].legend(fontsize=8)
j=np.arange(4);ax[1].bar(j-.18,np.bincount(y,minlength=4)/len(y),.36,label="Observada");ax[1].bar(j+.18,P.mean(axis=0),.36,label="Predicha promedio")
ax[1].set(xticks=j,xticklabels=alternativas,ylabel="Proporción",title="Ajuste promedio dentro de la muestra");ax[1].tick_params(axis="x",labelrotation=15);ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: el ingreso redistribuye una probabilidad total de uno entre las alternativas. Con constantes por alternativa, el ajuste iguala las frecuencias promedio en la muestra, aunque pueda predecir mal decisiones individuales. Un coeficiente positivo respecto de la base no basta para afirmar que la probabilidad absoluta siempre aumenta. Son asociaciones, no efectos causales identificados.")`
},
{
id:"ic4-base",title:"03 Clase 4 · Cambiar la categoría base",dataset:"mus15",
parameters:"base_a,base_b=1,2  # 1 playa, 2 muelle, 3 privado, 4 arrendado",
description:"Slides 13–16. Estima el mismo modelo con dos referencias. base_a y base_b usan 1=playa, 2=muelle, 3=privado, 4=arrendado.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`if not all(isinstance(v,int) and 1<=v<=4 for v in [base_a,base_b]): raise ValueError("Usa bases enteras entre 1 y 4.")
d,y,_,_=pesca();X=np.column_stack([np.ones(len(d)),d.income.to_numpy()])
Za,_=diseno_mnl(X,base=base_a-1);ba,_,lla,Pa,_=estimar_eleccion(Za,y)
Zb,_=diseno_mnl(X,base=base_b-1);bb,_,llb,Pb,_=estimar_eleccion(Zb,y)
A=coef_mnl(ba,2,4,base_a-1);B=coef_mnl(bb,2,4,base_b-1)
print(pd.DataFrame({"constante A":A[:,0],"ingreso A":A[:,1],"constante B":B[:,0],"ingreso B":B[:,1]},index=alternativas).round(5))
print("Error de cambio de referencia B = A - A[base B]:",np.max(abs(B-(A-A[base_b-1]))))
print(f"Log L: {lla:.6f} y {llb:.6f}; máxima diferencia de probabilidades={np.max(abs(Pa-Pb)):.2e}")
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(4)
ax[0].bar(j-.18,A[:,1],.36,label=f"Base {alternativas[base_a-1]}");ax[0].bar(j+.18,B[:,1],.36,label=f"Base {alternativas[base_b-1]}")
ax[0].set(xticks=j,xticklabels=alternativas,ylabel="Coeficiente de ingreso",title="Cambia la referencia");ax[0].tick_params(axis="x",labelrotation=15);ax[0].legend(fontsize=8)
ax[1].scatter(Pa.ravel(),Pb.ravel(),s=3,alpha=.2);ax[1].plot([0,1],[0,1],"--",color="black")
ax[1].set(xlabel="Probabilidad con base A",ylabel="Probabilidad con base B",title="Las predicciones coinciden");fig.tight_layout()
print("Conclusión: elegir una base fija el punto de referencia de las utilidades, no cambia las decisiones que explica el modelo. Un signo puede cambiar al cambiar la comparación; las probabilidades, los efectos marginales y la verosimilitud se conservan.")`
},
{
id:"ic4-marginales",title:"04 Clase 4 · Coeficientes, RRR y efectos marginales",dataset:"mus15",
parameters:"aumento_dolares,ingreso_inicial=1000.0,4.0  # Ingreso inicial en miles de dólares",
description:"Slides 14–19. Cambia aumento_dolares e ingreso_inicial. Distingue RRR, AME, MEM y cambio exacto; income está en miles de dólares.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`d,y,_,_=pesca();ing=d.income.to_numpy();delta=aumento_dolares/1000
if not np.isfinite(delta) or not np.isfinite(ingreso_inicial) or ingreso_inicial<0 or ingreso_inicial+delta<0 or (ing+delta).min()<0: raise ValueError("Los ingresos de ambos escenarios deben ser no negativos y finitos.")
X=np.column_stack([np.ones(len(d)),ing]);Z,_=diseno_mnl(X);b,se,ll,P,V=estimar_eleccion(Z,y);beta=coef_mnl(b,2,4,0)
slopes=beta[:,1];me=P*(slopes-(P@slopes)[:,None]);ame=me.mean(axis=0)
pm=softmax(np.array([1.,ing.mean()])@beta.T);mem=pm*(slopes-pm@slopes)
X1=X.copy();X1[:,1]+=delta;P1=softmax(X1@beta.T,axis=1);exacto=(P1-P).mean(axis=0)
p0=softmax(np.array([1.,ingreso_inicial])@beta.T);p1=softmax(np.array([1.,ingreso_inicial+delta])@beta.T)
rrr=np.exp(slopes*delta)
print(pd.DataFrame({"beta ingreso":slopes,"RRR para cambio vs playa":rrr,"AME pp/mil $":100*ame,"MEM pp/mil $":100*mem,"cambio exacto medio pp":100*exacto},index=alternativas).round(5))
print("Perfil elegido [p inicial, p final, cambio pp]:\n",pd.DataFrame(np.column_stack([p0,p1,100*(p1-p0)]),index=alternativas))
print("Comprobación RRR = (p1_j/p1_playa)/(p0_j/p0_playa):",(p1/p1[0])/(p0/p0[0]))
print("Suma de efectos AME:",ame.sum(),"; suma de cambios exactos:",exacto.sum())
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(4)
ax[0].bar(j-.18,100*ame,.36,label="AME");ax[0].bar(j+.18,100*mem,.36,label="MEM");ax[0].set(ylabel="pp por mil dólares",title="Promediar efectos ≠ efecto en la media")
ax[1].bar(j-.18,100*ame*delta,.36,label="AME × cambio");ax[1].bar(j+.18,100*exacto,.36,label="Cambio exacto medio");ax[1].set(ylabel="Cambio en puntos porcentuales",title=f"Aumento de {aumento_dolares:g} dólares")
for eje in ax: eje.set_xticks(j,alternativas);eje.tick_params(axis="x",labelrotation=15);eje.axhline(0,color="gray");eje.legend(fontsize=8)
fig.tight_layout()
print("Conclusión: beta cambia log(p_j/p_base); exp(beta*delta) multiplica esa razón, no la probabilidad de j. RRR=0.867 significa 13.3% menos en la razón relativa, no 13.3 puntos porcentuales. AME promedia derivadas personales y MEM usa características medias. Para un cambio grande conviene recalcular probabilidades: la aproximación lineal puede separarse del cambio exacto.")`
},
{
id:"ic4-ajuste",title:"05 Clase 4 · Qué tan bien predice el modelo",dataset:"mus15",
parameters:"fraccion_entrenamiento=.75;semilla=123",
description:"Slides 4 y 15–18. Compara ingreso frente a solo constantes; calcula LR y pseudo-R². Usa una partición reproducible para distinguir ajuste de predicción fuera de muestra.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`if not .5<=fraccion_entrenamiento<=.9: raise ValueError("Usa fracción entre .5 y .9.")
d,y,_,_=pesca();X=np.column_stack([np.ones(len(d)),d.income.to_numpy()]);Z,_=diseno_mnl(X)
b,se,ll,P,V=estimar_eleccion(Z,y);freq=np.bincount(y,minlength=4)/len(y);ll0=np.log(freq[y]).sum();LR=2*(ll-ll0)
print(f"Log L ingreso={ll:.4f}; solo constantes={ll0:.4f}; LR(3)={LR:.4f}; p={chi2.sf(LR,3):.6g}; pseudo-R²={1-ll/ll0:.5f}")
orden=np.random.default_rng(semilla).permutation(len(y));corte=int(len(y)*fraccion_entrenamiento);tr,te=orden[:corte],orden[corte:]
bt,_,_,_,_=estimar_eleccion(Z[tr],y[tr]);Pt=probabilidades(Z[te],bt);ftr=np.bincount(y[tr],minlength=4)/len(tr);Pnull=np.tile(ftr,(len(te),1));Y=np.eye(4)[y[te]]
metricas=[]
for nombre,Q in [("Solo frecuencias",Pnull),("Ingreso",Pt)]:
    metricas.append([-np.log(np.maximum(Q[np.arange(len(te)),y[te]],1e-14)).mean(),np.mean(np.sum((Q-Y)**2,axis=1)),np.mean(Q.argmax(axis=1)==y[te])])
print("Validación fuera de muestra (no se usó para estimar):\n",pd.DataFrame(metricas,index=["Solo frecuencias","Ingreso"],columns=["log-loss (menor mejor)","Brier (menor mejor)","acierto (mayor mejor)"]).round(5))
conf=np.zeros((4,4),int);np.add.at(conf,(y[te],Pt.argmax(axis=1)),1)
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(4)
ax[0].bar(j-.18,np.bincount(y[te],minlength=4)/len(te),.36,label="Observado test");ax[0].bar(j+.18,Pt.mean(axis=0),.36,label="Predicho test");ax[0].set(xticks=j,xticklabels=alternativas,ylabel="Proporción",title="¿Predice las participaciones?");ax[0].tick_params(axis="x",labelrotation=15);ax[0].legend(fontsize=8)
im=ax[1].imshow(conf,cmap="Blues");fig.colorbar(im,ax=ax[1],shrink=.8)
for a in range(4):
    for c in range(4): ax[1].text(c,a,str(conf[a,c]),ha="center",va="center",color="black" if conf[a,c]<conf.max()*.55 else "white")
ax[1].set(xticks=j,xticklabels=alternativas,yticks=j,yticklabels=alternativas,xlabel="Clase más probable",ylabel="Clase observada",title="Matriz de clasificación (test)");ax[1].tick_params(axis="x",labelrotation=20);fig.tight_layout()
print("Conclusión: LR pregunta si ingreso aporta información al modelo; no si acierta cada decisión. Pseudo-R² mide mejora en log-verosimilitud frente a un modelo de referencia, no fracción de varianza explicada ni porcentaje de aciertos. Predecir probabilidades no exige resultados 0 o 1: una decisión puede seguir siendo incierta. La evaluación fuera de muestra evita confundir ajuste con capacidad predictiva.")`
},
{
id:"ic4-condicional",title:"06 Clase 4 · Logit condicional: precio y tasa de pesca",dataset:"mus15",
parameters:"persona,modo=0,1  # Modo: 1 playa, 2 muelle, 3 privado, 4 arrendado",
description:"Slides 7–11. Reproduce clogit d p q, group(id), sin constantes por alternativa. Cambia persona y modo para variar su precio dejando las otras características fijas.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`d,y,precios,tasas=pesca()
if not isinstance(persona,int) or not 0<=persona<len(d) or not isinstance(modo,int) or not 1<=modo<=4: raise ValueError("Revisa persona y modo.")
Z=diseno_pesca(precios,tasas);b,se,ll,P,V=estimar_eleccion(Z,y)
print(pd.DataFrame({"beta":b/np.array([100.,1.]),"SE":se/np.array([100.,1.])},index=["precio por dólar","tasa pesca"]).round(6))
print(f"Log L={ll:.4f}; log L uniforme={-len(y)*np.log(4):.4f}; pseudo-R² sin constantes={1-ll/(-len(y)*np.log(4)):.5f}")
print("Probabilidades persona:",dict(zip(alternativas,P[persona].round(4))))
g=np.linspace(0,max(200,2*precios[persona,modo-1]),120);pr=np.tile(precios[persona],(len(g),1));qr=np.tile(tasas[persona],(len(g),1));pr[:,modo-1]=g
pg=probabilidades(diseno_pesca(pr,qr),b)
fig,ax=plt.subplots(1,2,figsize=(10,4))
for j,nombre in enumerate(alternativas): ax[0].plot(g,pg[:,j],label=nombre)
ax[0].axvline(precios[persona,modo-1],color="gray",ls="--");ax[0].set(xlabel=f"Precio de {alternativas[modo-1]} ($)",ylabel="Probabilidad",title="Cambiar solo un precio");ax[0].legend(fontsize=8)
j=np.arange(4);ax[1].bar(j-.18,np.bincount(y,minlength=4)/len(y),.36,label="Observada");ax[1].bar(j+.18,P.mean(axis=0),.36,label="Predicha")
ax[1].set(xticks=j,xticklabels=alternativas,ylabel="Participación",title="Sin constantes específicas");ax[1].tick_params(axis="x",labelrotation=15);ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: importa cómo se compara cada alternativa con las demás para la misma persona. Al subir solo su precio, una opción se vuelve menos atractiva si beta_precio es negativo. Un ingreso con el mismo coeficiente para TODAS las opciones se cancelaría en el cociente; el ejercicio siguiente le permite tener coeficientes distintos. Estas son predicciones del modelo, sujetas a sus supuestos.")`
},
{
id:"ic4-combinado",title:"07 Clase 4 · Combinar ingreso, precios y tasa de pesca",dataset:"mus15",
parameters:"persona=0",
description:"Slides 20–24. Reproduce asclogit: atributos de alternativas más constantes e ingreso por alternativa (base playa). Coeficientes fijos; no es un mixed logit de coeficientes aleatorios.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`d,y,precios,tasas=pesca();ing=d.income.to_numpy()
if not isinstance(persona,int) or not 0<=persona<len(d): raise ValueError("Elige una persona válida.")
Z=diseno_pesca(precios,tasas,ing);b,se,ll,P,V=estimar_eleccion(Z,y)
nombres=["precio por dólar","tasa pesca"]+[a+" / "+v for a in alternativas[1:] for v in ["constante","ingreso (mil $)"]];esc=np.r_[100.,np.ones(len(b)-1)]
print(pd.DataFrame({"beta":b/esc,"SE":se/esc,"z":b/se},index=nombres).round(6))
freq=np.bincount(y,minlength=4)/len(y);ll0=np.log(freq[y]).sum()
print(f"Log L={ll:.4f}; referencia solo constantes={ll0:.4f}; pseudo-R²={1-ll/ll0:.5f}")
print("Probabilidades persona:",dict(zip(alternativas,P[persona].round(4))))
g=np.linspace(ing.min(),ing.max(),150);pr=np.tile(precios[persona],(len(g),1));qr=np.tile(tasas[persona],(len(g),1))
pg=probabilidades(diseno_pesca(pr,qr,g),b)
fig,ax=plt.subplots(1,2,figsize=(10,4))
for j,nombre in enumerate(alternativas): ax[0].plot(g,pg[:,j],label=nombre)
ax[0].set(xlabel="Ingreso (miles de dólares)",ylabel="Probabilidad",title="Precios y tasas fijos para este perfil");ax[0].legend(fontsize=8)
j=np.arange(4);ax[1].bar(j-.18,freq,.36,label="Observada");ax[1].bar(j+.18,P.mean(axis=0),.36,label="Predicha")
ax[1].set(xticks=j,xticklabels=alternativas,ylabel="Participación",title="Constantes ajustan los promedios");ax[1].tick_params(axis="x",labelrotation=15);ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: combinamos lo que cambia entre opciones (precio y pesca) con lo que cambia entre personas (ingreso). Las constantes recogen diferencias medias de atractivo respecto de playa. Un mejor ajuste no demuestra causalidad. El modelo sigue imponiendo IIA: la razón entre dos probabilidades no depende de los atributos de una tercera alternativa. No hay heterogeneidad aleatoria de coeficientes en este ajuste.")`
},
{
id:"ic4-cruzados",title:"08 Clase 4 · Subir un precio: efectos propios y cruzados",dataset:"mus15",
parameters:"modo,aumento_dolares=1,100.0  # Modo: 1 playa, 2 muelle, 3 privado, 4 arrendado",
description:"Slides 11 y 22–24. Mapa 4×4 de derivadas; filas son probabilidades y columnas precios. Cambia modo y aumento_dolares; compara derivada local y escenario exacto.",
code:IC4_BASE+IC4_CHOICE+IC4_FISH+String.raw`d,y,precios,tasas=pesca();ing=d.income.to_numpy()
if not isinstance(modo,int) or not 1<=modo<=4 or not np.isfinite(aumento_dolares) or (precios[:,modo-1]+aumento_dolares).min()<0: raise ValueError("Revisa modo y precios no negativos.")
Z=diseno_pesca(precios,tasas,ing);b,se,ll,P,V=estimar_eleccion(Z,y);bp=b[0]/100
derivada=bp*(np.einsum('ij,jk->ijk',P,np.eye(4))-P[:,:,None]*P[:,None,:]);AME=derivada.mean(axis=0)
nuevos=precios.copy();nuevos[:,modo-1]+=aumento_dolares;Pn=probabilidades(diseno_pesca(nuevos,tasas,ing),b)
exacto=(Pn-P).mean(axis=0);aprox=AME[:,modo-1]*aumento_dolares
print("AME pp por dólar (filas=probabilidades, columnas=precios):\n",pd.DataFrame(100*AME,index=alternativas,columns=alternativas).round(6))
print("Las columnas suman cero:",AME.sum(axis=0))
print(pd.DataFrame({"p antes":P.mean(axis=0),"p después":Pn.mean(axis=0),"cambio exacto pp":100*exacto,"aproximación pp":100*aprox},index=alternativas).round(5))
fig,ax=plt.subplots(1,2,figsize=(11,4.5));lim=np.max(abs(100*AME));im=ax[0].imshow(100*AME,cmap="RdBu",vmin=-lim,vmax=lim);fig.colorbar(im,ax=ax[0],shrink=.7,label="pp por dólar")
for j in range(4):
    for k in range(4): ax[0].text(k,j,f"{100*AME[j,k]:.3f}",ha="center",va="center",color="white" if abs(AME[j,k])>.65*np.max(abs(AME)) else "black",fontsize=8)
ax[0].set(xticks=np.arange(4),xticklabels=alternativas,yticks=np.arange(4),yticklabels=alternativas,xlabel="Precio que cambia",ylabel="Probabilidad afectada",title="Efectos propios y cruzados");ax[0].tick_params(axis="x",labelrotation=20)
j=np.arange(4);ax[1].bar(j-.18,100*aprox,.36,label="Derivada × cambio");ax[1].bar(j+.18,100*exacto,.36,label="Cambio exacto")
ax[1].set(xticks=j,xticklabels=alternativas,ylabel="Cambio en pp",title=f"Precio de {alternativas[modo-1]}: +{aumento_dolares:g} $");ax[1].tick_params(axis="x",labelrotation=20);ax[1].axhline(0,color="gray");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: con beta_precio negativo, subir el precio de una opción reduce su probabilidad y aumenta las otras. Lo que una pierde se reparte: los cambios suman cero. Multiplicar una derivada por 100 no es el cambio exacto de subir 100 dólares; con cambios grandes la aproximación puede incluso sugerir probabilidades imposibles. Recalcular el modelo respeta los límites de cero y uno.")`
},
{
id:"ic4-umbrales",title:"09 Clase 4 · Logit ordenado: mover los umbrales",
parameters:'n,pendiente=4000,1.0\ncortes=np.array([-.5,1.0]);modelo="logit"',
description:"Slides 25–28. Simula una variable latente y dos cortes. Cambia pendiente, cortes o modelo; observa cómo se reparten las probabilidades entre tres categorías.",
code:IC4_BASE+String.raw`if not isinstance(n,int) or not 100<=n<=20000 or cortes.shape!=(2,) or not np.all(np.isfinite(cortes)) or cortes[0]>=cortes[1] or modelo not in ["logit","probit"]: raise ValueError("Usa 100<=n<=20000, dos cortes crecientes y modelo logit/probit.")
x=rng.uniform(-3,3,n);u=rng.logistic(size=n) if modelo=="logit" else rng.normal(size=n)
latente=pendiente*x+u;y=np.digitize(latente,cortes)
g=np.linspace(-3,3,200);F=expit(cortes[None,:]-pendiente*g[:,None]) if modelo=="logit" else norm.cdf(cortes[None,:]-pendiente*g[:,None])
P=np.column_stack([F[:,0],F[:,1]-F[:,0],1-F[:,1]])
print("Categorías: 0 si latente<=corte1; 1 entre cortes; 2 sobre corte2 (igualdad tiene probabilidad cero).")
print("Frecuencias:",np.bincount(y,minlength=3)/n,"; cortes:",cortes)
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(x,latente,c=y,cmap="viridis",s=6,alpha=.2)
for c in cortes: ax[0].axhline(c,color="black",ls="--")
ax[0].set(xlabel="x",ylabel="Salud latente (escala hipotética)",title="Los umbrales convierten el índice en categorías",ylim=(-6,6))
for j,nombre in enumerate(["Pobre/regular","Buena","Excelente"]): ax[1].plot(g,P[:,j],label=nombre)
ax[1].set(xlabel="x",ylabel="Probabilidad",title=f"{modelo}: el grupo intermedio puede subir y bajar");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: un coeficiente positivo desplaza la variable latente hacia categorías altas: baja la probabilidad de la más baja y sube la de la más alta. La categoría intermedia puede primero ganar y luego perder personas. Mover los cortes cambia cómo clasificamos la misma variable latente. El orden importa, pero no supone distancias iguales entre las etiquetas; la escala del error se fija para identificar el modelo.")`
},
{
id:"ic4-salud",title:"10 Clase 4 · Salud, edad e ingreso con datos reales",dataset:"mus18",
parameters:"edad_min,edad_max=20.0,60.0  # Perfil: log-ingreso y enfermedades en sus medias",
description:"Slides 29–32. Reproduce ologit con mus18data, year=2. Muestra AME y MEM, probabilidades por edad y comparación con multinomial en la misma muestra.",
code:IC4_BASE+IC4_CHOICE+IC4_HEALTH+IC4_ORDER+String.raw`d,y,W,X,centro,escala=salud()
if not 0<=edad_min<edad_max<=100: raise ValueError("Revisa el rango de edad.")
b,cortes,ll,P=estimar_ordenado(X,y);beta_original=b/escala;cortes_original=cortes+centro@beta_original
print(f"n={len(y)}; log L ordenado={ll:.4f}")
print("Coeficientes [edad en años, log-ingreso, enfermedades]:",beta_original,"; umbrales escala original:",cortes_original)
F=expit(cortes[None,:]-(X@b)[:,None]);f=F*(1-F);factor=np.column_stack([-f[:,0],f[:,0]-f[:,1],f[:,1]])
AME=factor.mean(axis=0)[:,None]*beta_original[None,:]
fm=expit(cortes)*(1-expit(cortes));MEM=np.array([-fm[0],fm[0]-fm[1],fm[1]])[:,None]*beta_original[None,:]
print("AME pp/unidad:\n",pd.DataFrame(100*AME,index=salud_nombres,columns=["edad (año)","log-ingreso","enfermedades"]).round(5))
print("MEM pp/unidad (comparable con mfx por defecto):\n",pd.DataFrame(100*MEM,index=salud_nombres,columns=["edad (año)","log-ingreso","enfermedades"]).round(5))
ZM,_=diseno_mnl(np.column_stack([np.ones(len(X)),X]),J=3);bm,_,llm,PM,_=estimar_eleccion(ZM,y)
print(f"AIC ordenado={2*(len(b)+2)-2*ll:.3f}; multinomial={2*len(bm)-2*llm:.3f}. Misma muestra; menor es mejor según AIC, no es prueba de causalidad.")
print("Edad observada:",d.age.min(),"a",d.age.max(),"; salir de este rango es extrapolar.")
g=np.linspace(edad_min,edad_max,150);G=np.zeros((len(g),3));G[:,0]=(g-centro[0])/escala[0];pg=prob_ordenada(G,b,cortes)
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
for j,nombre in enumerate(salud_nombres): ax[0].plot(g,pg[:,j],label=nombre)
ax[0].set(xlabel="Edad (años)",ylabel="Probabilidad",title="Resto de características en sus medias");ax[0].legend(fontsize=8)
j=np.arange(3);ancho=.25
ax[1].bar(j-ancho,np.bincount(y,minlength=3)/len(y),ancho,label="Observada");ax[1].bar(j,P.mean(axis=0),ancho,label="Ordenado");ax[1].bar(j+ancho,PM.mean(axis=0),ancho,label="Multinomial")
ax[1].set(xticks=j,xticklabels=salud_nombres,ylabel="Proporción",title="El orden impone estructura");ax[1].tick_params(axis="x",labelrotation=15);ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: el logit ordenado usa una pendiente común y umbrales para conectar las categorías; multinomial permite pendientes distintas y usa más parámetros. La categoría intermedia puede reaccionar de forma diferente a las extremas. AME y MEM no son lo mismo; log-ingreso cambia aproximadamente 0.01 ante 1% más de ingreso. Estos datos describen asociaciones y no aíslan por sí solos efectos causales de edad, ingreso o enfermedades.")`
},
{
id:"ic4-rho",title:"11 Clase 4 · Probit bivariado: cambiar rho",
parameters:"n,rho,eta1,eta2=15000,.6,.5,-.3",
description:"Slides 33–37. Mantén los índices latentes fijos y cambia la correlación de los errores. Compara cuatro probabilidades conjuntas, marginales y correlación de las respuestas observadas.",
code:IC4_BASE+IC4_BIV+String.raw`if not isinstance(n,int) or not 500<=n<=50000 or not abs(rho)<=.95 or not max(abs(eta1),abs(eta2))<=3: raise ValueError("Usa 500<=n<=50000, |rho|<=.95 e índices entre -3 y 3.")
u=rng.normal(size=(n,2));u[:,1]=rho*u[:,0]+np.sqrt(1-rho*rho)*u[:,1]
y1=(eta1+u[:,0]>0).astype(int);y2=(eta2+u[:,1]>0).astype(int);categoria=2*y1+y2
teoria=prob_conjuntas(np.array([eta1]),np.array([eta2]),rho)[0];sim=np.bincount(categoria,minlength=4)/n
etiquetas=["(0,0)","(0,1)","(1,0)","(1,1)"]
print(pd.DataFrame({"teoría":teoria,"simulación":sim},index=etiquetas).round(5))
print(f"rho errores={rho}; correlación binaria observada={np.corrcoef(y1,y2)[0,1]:.4f}; no son el mismo parámetro.")
print(f"P(Y1=1)={norm.cdf(eta1):.4f}; P(Y2=1)={norm.cdf(eta2):.4f}; producto bajo independencia={norm.cdf(eta1)*norm.cdf(eta2):.4f}")
g=np.linspace(-.95,.95,120);Q=prob_conjuntas(np.full(len(g),eta1),np.full(len(g),eta2),g)
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(4)
ax[0].bar(j-.18,teoria,.36,label="Teoría");ax[0].bar(j+.18,sim,.36,label="Simulada");ax[0].set(xticks=j,xticklabels=etiquetas,ylabel="Probabilidad",title="Las cuatro combinaciones");ax[0].legend(fontsize=8)
for k,nombre in enumerate(etiquetas): ax[1].plot(g,Q[:,k],label=nombre)
ax[1].axvline(rho,color="gray",ls="--");ax[1].set(xlabel="Correlación de errores rho",ylabel="Probabilidad conjunta",title="Cambian las conjuntas, no las marginales");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: con los índices fijos, rho cambia la coincidencia de los resultados sin cambiar la probabilidad individual de cada sí. Rho positivo favorece combinaciones concordantes y negativo favorece discordantes. Con rho=0 las conjuntas se factorizan condicionalmente en X. En datos con X variables, compartir regresores puede correlacionar las respuestas incluso si los errores son independientes. Para (Y1,Y2)=(j,k), la CDF usa q1*q2*rho además de los índices con signo.")`
},
{
id:"ic4-biprobit",title:"12 Clase 4 · Salud y visitas al médico",dataset:"mus18",
parameters:"orden_integracion=40  # Prueba 60 para comprobar precisión; no es el tamaño de muestra.",
description:"Slides 36–39. Estima biprobit hlthe dmdu con edad, log-ingreso y enfermedades. Compara dos probit separados, LR para rho=0 y probabilidades conjuntas; usa el año 2 completo.",
code:IC4_BASE+IC4_HEALTH+IC4_BIV+String.raw`if orden_integracion not in [24,40,60,80]: raise ValueError("Usa 24, 40, 60 u 80 nodos.")
d,salud_y,W,Xc,centro,escala=salud();y1=(salud_y==2).astype(int);y2=d.dmdu.to_numpy().astype(int);X=np.column_stack([np.ones(len(d)),Xc])
b1,b2,rho,ll,V,sep1,sep2,llsep=estimar_biprobit(X,y1,y2,orden_integracion)
def original(b): return np.r_[b[0]-centro@(b[1:]/escala),b[1:]/escala]
print(pd.DataFrame({"salud conjunta":original(b1),"salud separada":original(sep1),"visita conjunta":original(b2),"visita separada":original(sep2)},index=["constante","edad (año)","log-ingreso","enfermedades"]).round(6))
se_eta=np.sqrt(V[-1,-1]);ic=np.tanh(np.arctanh(rho)+np.array([-1,1])*norm.ppf(.975)*se_eta);LR=max(0.,2*(ll-llsep));pvalor=chi2.sf(LR,1)
print(f"n={len(d)}; log L conjunto={ll:.5f}; separados={llsep:.5f}; rho={rho:.5f}; IC95% rho={ic}")
print(f"LR(1) para rho=0: {LR:.5f}; p={pvalor:.5f}; correlación binaria bruta={np.corrcoef(y1,y2)[0,1]:.5f}")
P=prob_conjuntas(X@b1,X@b2,rho);Ps=prob_conjuntas(X@sep1,X@sep2,0.)
etiquetas=["(0,0)","(0,1)","(1,0)","(1,1)"];obs=np.bincount(2*y1+y2,minlength=4)/len(d)
print("Orden: (salud excelente, visita médica).\n",pd.DataFrame({"observada":obs,"bivariado":P.mean(axis=0),"independencia condicional":Ps.mean(axis=0)},index=etiquetas).round(5))
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(4);ancho=.25
ax[0].bar(j-ancho,obs,ancho,label="Observada");ax[0].bar(j,P.mean(axis=0),ancho,label="Bivariado");ax[0].bar(j+ancho,Ps.mean(axis=0),ancho,label="Separados")
ax[0].set(xticks=j,xticklabels=etiquetas,ylabel="Probabilidad",title="Salud excelente y visita al médico");ax[0].legend(fontsize=8)
ax[1].errorbar([rho],[0],xerr=[[rho-ic[0]],[ic[1]-rho]],fmt="o",capsize=6);ax[1].axvline(0,color="gray",ls="--")
ax[1].set(xlabel="rho de los errores (IC 95%)",yticks=[],title="Incertidumbre sobre la dependencia residual",xlim=(min(-.2,ic[0]-.05),max(.2,ic[1]+.05)));fig.tight_layout()
print("Conclusión:","no rechazamos rho=0 al 5%; el ajuste conjunto no aporta evidencia suficiente de dependencia residual en esta muestra." if pvalor>=.05 else "rechazamos rho=0 al 5%; aparece evidencia de dependencia residual bajo este modelo.")
print("No rechazar no prueba independencia ni que rho sea exactamente cero. Compartir edad, ingreso y enfermedades puede relacionar los resultados aunque los errores sean independientes. Rho describe asociación no observada, no un efecto causal de visitar al médico sobre la salud; ninguna respuesta entra como causa de la otra en estas ecuaciones.")`
}
];
IC4_LABS.forEach(example=>{
  example.code=IC4_BASE+"\n# PARÁMETROS QUE PUEDES CAMBIAR\n"+example.parameters+"\n\n"+example.code.slice(IC4_BASE.length);
  ECON_PYTHON_EXAMPLES.push({...example,course:"inferencia-causal",classNumber:4,filename:example.title+".py"});
});
