// Clase 5: Tobit, truncamiento y Heckman. Programas independientes y editables.
window.ECON_IC5_DATA={
  mus16:{filename:"mus16data.csv",url:document.currentScript.dataset.medicalUrl},
  mroz:{filename:"mroz.csv",url:document.currentScript.dataset.mrozUrl}
};
const IC5_BASE=String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import norm
from scipy.special import log_ndtr
from scipy.optimize import minimize
rng=np.random.default_rng(123)
np.set_printoptions(precision=5,suppress=True)
`;
const IC5_CORE=String.raw`
def validar_n(n):
    if not isinstance(n,int) or not 50<=n<=10000: raise ValueError("Usa n entero entre 50 y 10000.")
def mills(c):
    return np.exp(norm.logpdf(c)-log_ndtr(c))
def diseno(X):
    X=np.asarray(X,float);n,p=X.shape
    if n<=p+2 or not np.all(np.isfinite(X)) or not np.allclose(X[:,0],1) or np.linalg.matrix_rank(X)<p:
        raise ValueError("X debe tener constante primero, datos finitos y rango completo; usa más observaciones.")
    T=np.eye(p)
    if p>1:
        sd=X[:,1:].std(axis=0)
        T[0,1:]=-X[:,1:].mean(axis=0)/sd;T[1:,1:]=np.diag(1/sd)
    return X@T,T
def ols(X,y):
    W,T=diseno(X);y=np.asarray(y,float)
    if y.shape!=(len(X),) or not np.all(np.isfinite(y)): raise ValueError("y debe ser un vector observado y finito.")
    a=np.linalg.lstsq(W,y,rcond=None)[0];e=y-W@a
    V=(e@e)/(len(y)-W.shape[1])*T@np.linalg.solve(W.T@W,T.T)
    return T@a,e,V
def objetos(mu,sigma):
    # Para Y=max(0,Y*). P positivo, media entre positivos, media de Y (incluye ceros).
    c=np.asarray(mu)/sigma;P=norm.cdf(c);positiva=mu+sigma*mills(c)
    media=mu*P+sigma*norm.pdf(c)
    return P,positiva,media
`;
const IC5_TOBIT=String.raw`
def ajustar_normal(X,y,L=0.,tipo="censura",superior=False,inferencia=False):
    # Normal censurada o truncada por debajo de L. Para un tope U, usa superior=True,L=U.
    if tipo not in ['censura','truncamiento']: raise ValueError("Elige censura o truncamiento.")
    if superior:
        b,s,ll,se=ajustar_normal(X,-np.asarray(y),-L,tipo,False,inferencia)
        return -b,s,ll,se
    y=np.asarray(y,float);W,T=diseno(X);n,p=W.shape
    if y.shape!=(n,) or not np.all(np.isfinite(y)) or np.any(y<L): raise ValueError("Hay valores inválidos o por debajo del límite observado.")
    activo=y>L
    if activo.sum()<=p+2 or (tipo=='truncamiento' and not activo.all()): raise ValueError("Necesitas suficientes observaciones sobre el límite; la muestra truncada no incluye ceros.")
    escala=max(y.std(),1e-6);v=(y-L)/escala
    a0=np.linalg.lstsq(W,v,rcond=None)[0];s0=max(np.std(v-W@a0),.2)
    def objetivo(a):
        b=a[:p];sigma=np.exp(a[p]);c=(W@b)/sigma;z=(v-W@b)/sigma
        logf=norm.logpdf(z)-a[p];gb=-z/sigma;gs=1-z*z
        if tipo=='censura':
            m=mills(-c);logf=np.where(activo,logf,log_ndtr(-c))
            gb=np.where(activo,gb,m/sigma);gs=np.where(activo,gs,-m*c)
        else:
            m=mills(c);logf=logf-log_ndtr(c);gb=gb+m/sigma;gs=gs-m*c
        return -logf.mean(),np.r_[W.T@gb/n,gs.mean()]
    fit=minimize(objetivo,np.r_[a0,np.log(s0)],jac=True,method='BFGS',options={'gtol':1e-8,'maxiter':350})
    if not np.isfinite(fit.fun) or np.max(abs(objetivo(fit.x)[1]))>2e-6:
        raise ValueError("No convergió: revisa cantidad de datos, censura extrema o identificación.")
    b=escala*T@fit.x[:p];b[0]+=L;sigma=escala*np.exp(fit.x[p])
    ll=-n*fit.fun-(activo.sum() if tipo=='censura' else n)*np.log(escala)
    se=None
    if inferencia:
        h=1e-5;I=np.eye(p+1)
        H=np.column_stack([(objetivo(fit.x+h*e)[1]-objetivo(fit.x-h*e)[1])/(2*h) for e in I])*n
        H=(H+H.T)/2
        if np.linalg.eigvalsh(H).min()<=0: raise ValueError("Información insuficiente para errores estándar.")
        J=np.zeros((p+1,p+1));J[:p,:p]=escala*T;J[p,p]=sigma
        V=J@np.linalg.solve(H,J.T);se=np.sqrt(np.diag(V))
    return b,sigma,ll,se
`;
const IC5_HECK=String.raw`
def probit(Z,s):
    W,T=diseno(Z);s=np.asarray(s,int)
    if s.shape!=(len(Z),) or set(np.unique(s))!={0,1}: raise ValueError("La selección debe contener tanto 0 como 1.")
    signo=2*s-1
    def obj(g):
        a=signo*(W@g);m=mills(a)
        return -log_ndtr(a).mean(),-(W.T@(signo*m))/len(s)
    fit=minimize(obj,np.zeros(W.shape[1]),jac=True,method='BFGS',options={'gtol':1e-8,'maxiter':200})
    if np.max(abs(obj(fit.x)[1]))>2e-6 or np.max(abs(fit.x))>40: raise ValueError("Probit no converge o hay separación; aumenta n o reduce selección extrema.")
    a=signo*(W@fit.x);m=mills(a);H=W.T@((m*(m+a))[:,None]*W)
    if np.linalg.eigvalsh(H).min()<1e-9: raise ValueError("Probit sin suficiente información.")
    return T@fit.x,T@np.linalg.solve(H,T.T)
def heckman(X,Z,y,s,inferencia=False):
    s=np.asarray(s,dtype=bool);g,Vg=probit(Z,s.astype(int));indice=Z@g;lam=mills(indice)
    W=np.column_stack([X[s],lam[s]]);b,e,Vnaive=ols(W,np.asarray(y)[s])
    if not inferencia: return b,g,lam
    delta=lam[s]*(lam[s]+indice[s]);sigma=np.sqrt(np.mean(e*e)+b[-1]**2*delta.mean());rho=b[-1]/sigma
    # Covarianza de dos etapas: incluye heteroscedasticidad inducida y estimación de gamma.
    # No se trunca rho silenciosamente: para casos fuera de [-1,1], usar bootstrap.
    if abs(rho)>=1: raise ValueError("rho estimado fuera de [-1,1]; esta muestra necesita revisión o bootstrap.")
    A=np.linalg.solve(W.T@W,np.eye(W.shape[1]));D=W.T@(delta[:,None]*Z[s])
    carne=W.T@((1-rho*rho*delta)[:,None]*W)+rho*rho*D@Vg@D.T
    V=sigma*sigma*A@carne@A
    return b,g,lam,V,Vnaive,sigma,rho
`;
const IC5_MED=String.raw`
def medicos():
    nombres=['age','female','educ','blhisp','totchr','ins'];d=pd.read_csv('mus16data.csv')
    X=np.column_stack([np.ones(len(d)),d[nombres].to_numpy()]);y=d.ambexp.to_numpy()
    return d,nombres,X,y
`;
const IC5_LABS=[];
// Los bloques se ordenan por su número al registrar los ejemplos al final.
IC5_LABS.push(
{
id:"ic5-observar",title:"01 Clase 5 · Censura, truncamiento y selección: qué observamos",
description:"Slides 2–16. La misma población se observa de tres maneras. Cambia el límite o lado para comparar un piso con un tope. En selección queda la fila, pero y es missing; en truncamiento desaparece la fila.",
parameters:String.raw`n,limite,lado=500,0.0,"inferior"  # lado: "inferior" o "superior"`,
code:IC5_BASE+IC5_CORE+String.raw`validar_n(n)
if lado not in ['inferior','superior'] or not np.isfinite(limite): raise ValueError("Revisa lado y límite.")
x=rng.normal(size=n);u=rng.normal(size=n);latente=.3+1.2*x+u
visible=latente>limite if lado=='inferior' else latente<limite
censurada=np.maximum(latente,limite) if lado=='inferior' else np.minimum(latente,limite)
# Aquí la selección depende de otra regla, no del umbral de la variable y.
s=(.5*x+.7*u+rng.normal(size=n)>0);seleccion=np.where(s,latente,np.nan)
print(pd.DataFrame({'x':x,'y* simulada':latente,'y censurada':censurada,'entra truncada':visible,'s':s.astype(int),'y seleccionada':seleccion}).head(12).round(3))
print(f"Población: {n} filas; censura: {n} filas; truncamiento: {visible.sum()} filas; selección: {n} filas, {s.sum()} resultados observados.")
fig,ax=plt.subplots(1,3,figsize=(12,4))
ax[0].scatter(x,latente,s=8,alpha=.15,color='gray',label='Latente (solo simulador)');ax[0].scatter(x,censurada,s=9,alpha=.5);ax[0].axhline(limite,color='C1',ls='--');ax[0].set(title='Censura: valores en el límite',xlabel='x',ylabel='y');ax[0].legend(fontsize=7)
ax[1].scatter(x[visible],latente[visible],s=9,alpha=.5);ax[1].axhline(limite,color='C1',ls='--');ax[1].set(title='Truncamiento: faltan filas',xlabel='x')
ax[2].scatter(x[s],latente[s],s=9,alpha=.5);ax[2].plot(x[~s],np.full((~s).sum(),latente.min()-1),'|',color='C1',label='Solo conocemos x y s=0');ax[2].set(title='Selección: y no observada',xlabel='x');ax[2].legend(fontsize=7);fig.tight_layout()
print("Conclusión: censurar recodifica y en un límite; truncar elimina observaciones completas; seleccionar deja y sin observar para algunas filas. Un missing no significa cero. La línea naranja inferior del panel de selección solo marca las x conocidas: no asigna salarios ni resultados a esas personas. Elegir el modelo exige conocer cómo se generaron los datos.")`
},
{
id:"ic5-tobit-sim",title:"02 Clase 5 · Horas de trabajo: MCO, Tobit y regresión truncada",
description:"Slides 8–10 y 18–22. Simula el modelo de horas de las slides. Compara MCO sobre todos los datos censurados, MCO entre positivos, Tobit y máxima verosimilitud truncada. Cambia la censura modificando el intercepto o L.",
parameters:String.raw`n,b0,b1,sigma,L=1000,-2500.0,1000.0,1000.0,0.0`,
code:IC5_BASE+IC5_CORE+IC5_TOBIT+String.raw`validar_n(n)
if sigma<=0: raise ValueError("sigma debe ser positiva.")
x=rng.normal(2.75,.6,n);X=np.column_stack([np.ones(n),x]);latente=b0+b1*x+rng.normal(0,sigma,n);y=np.maximum(L,latente);s=y>L
bc,_,_=ols(X,y);bp,_,_=ols(X[s],y[s]);bt,st,_,_=ajustar_normal(X,y,L);btr,str_,_,_=ajustar_normal(X[s],y[s],L,'truncamiento')
print(f"Fracción censurada={1-s.mean():.3f}; n={n}; positivos sobre L={s.sum()}")
print(pd.DataFrame({'Verdad':[b0,b1],'MCO censurada':bc,'MCO truncada':bp,'Tobit':bt,'Normal truncada':btr},index=['constante','log salario']).round(3))
g=np.linspace(x.min(),x.max(),200);G=np.column_stack([np.ones(len(g)),g]);mu=G@bt;c=(mu-L)/st
media=L+(mu-L)*norm.cdf(c)+st*norm.pdf(c)
fig,ax=plt.subplots(1,2,figsize=(11,4.3));ax[0].scatter(x,y,s=9,alpha=.2);ax[0].plot(g,G@bc,label='MCO sobre y');ax[0].plot(g,media,label='Media observada Tobit');ax[0].plot(g,b0+b1*g,'--',label='Media latente verdadera');ax[0].axhline(L,color='gray');ax[0].set(xlabel='log salario',ylabel='Horas',title='La media observada tiene curvatura');ax[0].legend(fontsize=8)
ax[1].bar(['MCO\ncensurada','MCO\ntruncada','Tobit','Normal\ntruncada'],[bc[1],bp[1],bt[1],btr[1]]);ax[1].axhline(b1,color='black',ls='--',label='Pendiente latente verdadera');ax[1].set(ylabel='Pendiente',title='No todos estiman el mismo objeto');ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: MCO ajusta la variable que le entregamos y no recupera automáticamente la pendiente latente. Tobit utiliza los valores observados y la probabilidad de caer en el límite. La regresión truncada usa una muestra distinta y una densidad condicionada a entrar. Cuando el modelo normal homocedástico es correcto, ambas verosimilitudes apuntan a la pendiente latente; una muestra finita no garantiza acertar exactamente.")`
},
{
id:"ic5-verosimilitud",title:"03 Clase 5 · Tobit: un cero aporta una probabilidad",
description:"Slides 16–22. Separa la masa de probabilidad en cero de la densidad de los valores positivos. La verosimilitud usa CDF para ceros y PDF para positivos; en una muestra truncada divide la densidad por la probabilidad de entrar.",
parameters:String.raw`n,mu,sigma=1500,.5,1.2`,
code:IC5_BASE+IC5_CORE+String.raw`validar_n(n)
if sigma<=0: raise ValueError("sigma debe ser positiva.")
latente=rng.normal(mu,sigma,n);y=np.maximum(0,latente);s=y>0
print(f"P(Y=0) teórica={norm.cdf(-mu/sigma):.4f}; observada={np.mean(~s):.4f}")
print(f"P(Y>0)={norm.cdf(mu/sigma):.4f}; masa en cero + área positiva=1")
grid=np.linspace(mu-2*sigma,mu+2*sigma,200)
ll=np.array([norm.logpdf(y[s],m,sigma).sum()+(~s).sum()*log_ndtr(-m/sigma) for m in grid])
g=np.linspace(0,max(.1,mu+4*sigma),300);fpos=norm.pdf(g,mu,sigma)
fig,ax=plt.subplots(1,3,figsize=(12,4));ax[0].bar(['Y=0','Y>0'],[norm.cdf(-mu/sigma),norm.cdf(mu/sigma)]);ax[0].set(ylabel='Probabilidad',ylim=(0,1),title='Masa puntual y masa continua')
ax[1].plot(g,fpos,label='Censura: área = P(Y>0)');ax[1].plot(g,fpos/norm.cdf(mu/sigma),'--',label='Truncamiento: área = 1');ax[1].set(xlabel='Valor positivo de y',ylabel='Densidad',title='Una densidad no es P(Y=y)');ax[1].legend(fontsize=7)
ax[2].plot(grid,ll);ax[2].axvline(mu,color='C1',ls='--',label='Verdad');ax[2].set(xlabel='Media latente candidata',ylabel='Log-verosimilitud',title='Sigma fija: buscar la mejor media');ax[2].legend(fontsize=8);fig.tight_layout()
print("Conclusión: observar un cero informa que la variable latente está por debajo del límite, no que vale exactamente cero. Por eso su contribución es una probabilidad acumulada. Para un valor positivo usamos densidad. El truncamiento cambia la población observada y obliga a renormalizar esa densidad; tratar ceros como observaciones normales o borrarlos usa otra verosimilitud.")`
},
{
id:"ic5-tres-medias",title:"04 Clase 5 · Tobit: tres predicciones y dos vías de cambio",
description:"Slides 27–36. Distingue media latente, media entre positivos y media incluyendo ceros. Descompone el efecto total en participación y monto. Cambia beta y sigma; las curvas se calculan exactamente, sin error de simulación.",
parameters:String.raw`b0,beta,sigma=-.5,1.2,1.0
x0=0.5`,
code:IC5_BASE+IC5_CORE+String.raw`if sigma<=0 or not -3<=x0<=3: raise ValueError("Usa sigma>0 y x0 entre -3 y 3.")
x=np.linspace(-3,3,300);mu=b0+beta*x;P,positiva,media=objetos(mu,sigma);c=mu/sigma;lam=mills(c)
dp=norm.pdf(c)*beta/sigma;dmpos=beta*(1-lam*(c+lam));dm=beta*P
extensivo=dp*positiva;intensivo=P*dmpos
c0=(b0+beta*x0)/sigma;l0=mills(c0)
print(f"En x={x0}: efecto latente={beta:.4f}; efecto P(Y>0)={norm.pdf(c0)*beta/sigma:.4f}; efecto entre positivos={beta*(1-l0*(c0+l0)):.4f}; efecto total={beta*norm.cdf(c0):.4f}")
print("Derivada correcta entre positivos: beta*[1-lambda(c)*(c+lambda(c))].")
fig,ax=plt.subplots(1,3,figsize=(12,4.3));ax[0].plot(x,mu,label='E[Y*|x]');ax[0].plot(x,positiva,label='E[Y|Y>0,x]');ax[0].plot(x,media,label='E[Y|x], incluye ceros');ax[0].set(xlabel='x',ylabel='Resultado esperado',title='Tres objetos diferentes');ax[0].legend(fontsize=7)
ax[1].plot(x,P);ax[1].set(xlabel='x',ylabel='P(Y>0|x)',ylim=(0,1),title='Participación')
ax[2].plot(x,dm,label='Efecto total');ax[2].plot(x,extensivo,'--',label='Vía participación');ax[2].plot(x,intensivo,':',label='Vía monto positivo');ax[2].set(xlabel='x',ylabel='Derivada de la media observada',title='Las dos vías se suman');ax[2].legend(fontsize=7);fig.tight_layout()
print("Conclusión: beta describe la variable latente. El promedio observado puede cambiar porque más personas tienen y positiva y porque cambia el monto entre quienes son positivos. En Tobit ambas vías están vinculadas por el mismo modelo. La probabilidad se mide en puntos de probabilidad; las medias, en unidades de y. No son efectos intercambiables ni identifican causalidad sin supuestos adicionales.")`
},
{
id:"ic5-medico",title:"05 Clase 5 · Gasto ambulatorio: reproducir Tobit de Stata",dataset:"mus16",
description:"Slides 23–26 y 37. Usa mus16data.dta convertido a CSV. Reproduce los coeficientes y la log-verosimilitud del do-file; compara gasto medio y frecuencia de ceros observados con las predicciones del modelo.",
parameters:String.raw`percentil_grafico=99  # Solo recorta el eje del histograma, nunca la estimación.`,
code:IC5_BASE+IC5_CORE+IC5_TOBIT+IC5_MED+String.raw`if not 80<=percentil_grafico<=100: raise ValueError("Usa percentil entre 80 y 100.")
d,nombres,X,y=medicos();b,sigma,ll,se=ajustar_normal(X,y,inferencia=True);bm,_,_=ols(X,y)
P,positiva,media=objetos(X@b,sigma)
print(f"n={len(y)}; ceros={np.sum(y==0)} ({np.mean(y==0):.2%}); positivos={np.sum(y>0)}")
print(pd.DataFrame({'Tobit latente':b,'SE clásico Tobit':se[:-1],'MCO observado':bm},index=['constante']+nombres).round(5))
print(f"sigma={sigma:.5f}; sigma²={sigma*sigma:.3f}; log L={ll:.5f}")
print(f"Media observada={y.mean():.2f}; predicha Tobit={media.mean():.2f}; ceros observados={np.mean(y==0):.3f}; predichos={np.mean(1-P):.3f}")
print("age está en décadas: 3.3 representa 33 años. Un aumento de una unidad age son diez años, no uno.")
print("xb predice la media LATENTE; no es el gasto observado esperado. sigma es desviación, sigma² es varianza.")
tope=np.percentile(y,percentil_grafico);fig,ax=plt.subplots(1,2,figsize=(10,4.3));ax[0].hist(y,bins=80,range=(0,tope));ax[0].set(xlabel='Gasto ambulatorio (unidades originales)',ylabel='Personas',title=f'Distribución hasta percentil {percentil_grafico:g}')
ax[1].bar(['Observados','Predichos Tobit'],[np.mean(y==0),np.mean(1-P)]);ax[1].set(ylabel='Fracción de ceros',ylim=(0,1),title='Ajustar un modelo no garantiza buen ajuste');fig.tight_layout()
print("Conclusión: reproducir los coeficientes de Stata permite comprobar el cálculo, pero no valida los supuestos. Muchos ceros y una cola larga no bastan para justificar Tobit. Comparar los ceros y medias predichos con los observados revela discrepancias; no debemos afirmar que Tobit corrige automáticamente estos datos. Son datos docentes históricos, no recomendaciones médicas ni evidencia causal.")`
},
{
id:"ic5-marginales",title:"06 Clase 5 · Gasto: AME, MEM y cambios de variables binarias",dataset:"mus16",
description:"Slides 27–36 y Tobit model.do. Elige age, educ, totchr, female, blhisp o ins. Compara promedio de efectos individuales (AME) y efecto en las medias (MEM), para probabilidad, gasto positivo y gasto total.",
parameters:String.raw`variable="age"
unidad_edad="anio"  # "anio" o "decada"; solo cambia la unidad de presentación.`,
code:IC5_BASE+IC5_CORE+IC5_TOBIT+IC5_MED+String.raw`d,nombres,X,y=medicos()
if variable not in nombres or unidad_edad not in ['anio','decada']: raise ValueError("Revisa variable y unidad de edad.")
b,sigma,ll,_=ajustar_normal(X,y);j=1+nombres.index(variable);binaria=variable in ['female','blhisp','ins'];xm=X.mean(axis=0,keepdims=True)
def efecto(W):
    if binaria:
        A=W.copy();B=W.copy();A[:,j]=0;B[:,j]=1
        return np.column_stack(objetos(B@b,sigma))-np.column_stack(objetos(A@b,sigma))
    c=(W@b)/sigma;lam=mills(c)
    return np.column_stack([norm.pdf(c)*b[j]/sigma,b[j]*(1-lam*(c+lam)),b[j]*norm.cdf(c)])
factor=.1 if variable=='age' and unidad_edad=='anio' else 1.
individuales=factor*efecto(X);ame=individuales.mean(axis=0);mem=(factor*efecto(xm))[0]
print("Variable:",variable,"; tipo:",'cambio discreto 0→1' if binaria else 'derivada local')
if variable=='age': print("Efectos por",'un año (=0.1 age)' if factor==.1 else 'una década (=1 age)')
print(pd.DataFrame({'AME':ame,'MEM':mem},index=['P(gasto>0)','E[gasto|gasto>0,x]','E[gasto|x], incluye ceros']).round(6))
print("Para probabilidad, multiplica por 100 para puntos porcentuales. No son cambios porcentuales del gasto.")
fig,ax=plt.subplots(1,3,figsize=(12,4));titulos=['Probabilidad positiva','Gasto entre positivos','Gasto incluyendo ceros']
for k in range(3):
    ax[k].bar(['AME','MEM'],[ame[k],mem[k]]);ax[k].axhline(0,color='gray');ax[k].set(title=titulos[k],ylabel='Puntos de probabilidad' if k==0 else 'Unidades monetarias')
fig.tight_layout()
print("Conclusión: en modelos no lineales, promediar efectos no equivale a evaluar el efecto en una persona con características promedio. Para una dummy comparamos 0 con 1; no usamos una derivada de una variable que no puede cambiar infinitesimalmente. En age los valores originales son décadas: convertirlos evita interpretar diez años como uno. Estas son asociaciones del Tobit y dependen de sus supuestos.")`
}
);
IC5_LABS.push(
{
id:"ic5-supuestos",title:"07 Clase 5 · Cuando Tobit se equivoca: sus supuestos importan",
description:"Slide 37. Monte Carlo: aplica el mismo Tobit normal homocedástico a datos correctos, heteroscedásticos y asimétricos. Los tres procesos tienen la misma media latente; cambia intensidad, n y B.",
parameters:String.raw`n,B,beta,intensidad=500,100,1.0,.7`,
code:IC5_BASE+IC5_CORE+IC5_TOBIT+String.raw`validar_n(n)
if n>2000 or not isinstance(B,int) or not 20<=B<=300 or not 0<=intensidad<=1.2: raise ValueError("Usa n<=2000, B entero 20–300 e intensidad entre 0 y 1.2.")
estimaciones={k:[] for k in ['Normal homocedástico','Normal heteroscedástico','Error asimétrico']};fallos={k:0 for k in estimaciones}
for rep in range(B):
    x=rng.uniform(-2,2,n);X=np.column_stack([np.ones(n),x]);normal=rng.normal(size=n)
    errores=[normal,np.exp(intensidad*x/2)*normal,rng.exponential(size=n)-1]
    for etiqueta,u in zip(estimaciones,errores):
        y=np.maximum(0,-.4+beta*x+u)
        try: estimaciones[etiqueta].append(ajustar_normal(X,y)[0][1])
        except ValueError: fallos[etiqueta]+=1
for k,v in estimaciones.items():
    if len(v)<.9*B: raise ValueError("Demasiados ajustes fallidos; revisa los parámetros.")
    print(f"{k}: media={np.mean(v):.4f}, SD={np.std(v,ddof=1):.4f}, diferencia respecto a beta={np.mean(v)-beta:.4f}, fallos={fallos[k]}")
fig,ax=plt.subplots(figsize=(10,4.5));ax.boxplot(list(estimaciones.values()),showfliers=False);ax.set_xticks([1,2,3],['Normal\nhomocedástico','Normal\nheteroscedástico','Error\nasimétrico']);ax.axhline(beta,color='C1',ls='--',label='Beta latente verdadera');ax.set(ylabel='Pendiente Tobit estimada',title='Más datos no arreglan un modelo mal especificado');ax.legend();fig.tight_layout()
print("Conclusión: Tobit recupera la pendiente latente bajo sus supuestos, pero puede fallar si cambia la varianza del error con x o si la distribución del error es incorrecta. Aquí E[u|x]=0 en los tres escenarios: el problema surge al combinar censura con una verosimilitud equivocada. Aumentar n puede concentrar las estimaciones alrededor de un valor incorrecto. La simulación ilustra estos casos; no afirma que toda desviación produzca siempre el mismo sesgo.")`
},
{
id:"ic5-dos-partes",title:"08 Clase 5 · Muchos ceros no siempre significan censura",
description:"Extensión de slides 6 y 37. Un modelo en dos partes permite que x aumente la participación y reduzca el monto positivo. Compara su flexibilidad con las restricciones del Tobit. Datos simulados, no una réplica adicional de la base médica.",
parameters:String.raw`n,b_participacion,b_monto,sigma=2000,1.0,-.6,.5`,
code:IC5_BASE+IC5_CORE+IC5_TOBIT+IC5_HECK+String.raw`validar_n(n)
if sigma<=0: raise ValueError("Usa sigma>0.")
x=rng.uniform(-2,2,n);X=np.column_stack([np.ones(n),x]);s=rng.normal(size=n)<(-.3+b_participacion*x)
monto=np.exp(1+b_monto*x+rng.normal(0,sigma,n));y=np.where(s,monto,0.)
gp,_=probit(X,s.astype(int));bm,e,_=ols(X[s],np.log(y[s]));smear=np.mean(np.exp(e));bt,st,_,_=ajustar_normal(X,y)
g=np.linspace(-2,2,200);G=np.column_stack([np.ones(len(g)),g])
p=norm.cdf(G@gp);m=np.exp(G@bm)*smear;pt,mt,yt=objetos(G@bt,st)
verdad_p=norm.cdf(-.3+b_participacion*g);verdad_m=np.exp(1+b_monto*g+sigma*sigma/2)
fig,ax=plt.subplots(1,3,figsize=(12,4));titulos=['P(Y>0|x)','E[Y|Y>0,x]','E[Y|x]']
for a,v,dos,tob,titulo in zip(ax,[verdad_p,verdad_m,verdad_p*verdad_m],[p,m,p*m],[pt,mt,yt],titulos):
    a.plot(g,v,color='black',ls='--',label='Verdad');a.plot(g,dos,label='Dos partes');a.plot(g,tob,label='Tobit');a.set(xlabel='x',title=titulo);a.legend(fontsize=7)
fig.tight_layout();print(f"Proporción positiva={s.mean():.3f}; coef. probit x={gp[1]:.4f}; coef. log-monto x={bm[1]:.4f}; coef. Tobit x={bt[1]:.4f}")
print("Conclusión: aquí los ceros vienen de una decisión de participar y el monto positivo de otro proceso. Con los parámetros por defecto, x eleva la participación pero reduce el gasto entre participantes. Tobit liga ambos márgenes al mismo coeficiente y no puede reproducir esos signos opuestos. Un modelo en dos partes los separa; su flexibilidad tampoco garantiza causalidad. La corrección exp(residuo) evita confundir exp(E[log Y]) con E[Y].")`
},
{
id:"ic5-seleccion",title:"09 Clase 5 · Selección muestral: del do-file a Heckman",
description:"Slides 38–46 y Ejemplo de sample selection.do. Replica el proceso de Stata: v=carga*u+ruido. Compara MCO poblacional (solo accesible al simulador), MCO seleccionado y Heckman en dos etapas.",
parameters:String.raw`n,beta,gamma1,gamma2,carga=1000,.5,.5,-.5,.9
# carga NO es rho: con varianzas de los dos ruidos iguales a 1, rho=carga/sqrt(1+carga²).`,
code:IC5_BASE+IC5_CORE+IC5_HECK+String.raw`validar_n(n)
if abs(carga)>3 or max(abs(gamma1),abs(gamma2))>2: raise ValueError("Usa |carga|<=3 y |gamma|<=2 para evitar selección extrema.")
x1=rng.normal(2,3,n);x2=rng.normal(1,3,n);u=rng.normal(size=n);v=carga*u+rng.normal(size=n)
s=(gamma1*x1+gamma2*x2+v>=0);latente=beta*x1+u;y=np.where(s,latente,np.nan)
X=np.column_stack([np.ones(n),x1]);Z=np.column_stack([X,x2])
bp,_,_=ols(X,latente);bs,_,_=ols(X[s],y[s]);bh,g,lam=heckman(X,Z,y,s)
rho=carga/np.sqrt(1+carga*carga)
print(f"Seleccionados={s.sum()} de {n}; rho verdadero={rho:.4f}; carga={carga}")
print("Probit estima gamma normalizada por SD(v):",g,"; verdad:",np.array([0,gamma1,gamma2])/np.sqrt(1+carga*carga))
print(pd.DataFrame({'Verdad':[0,beta],'Población (solo simulador)':bp,'MCO seleccionado':bs,'Heckman':bh[:-1]},index=['constante','x1']).round(5))
print(f"Coeficiente Mills={bh[-1]:.4f}; verdad rho*sigma_u={rho:.4f}")
fig,ax=plt.subplots(1,2,figsize=(11,4.3));ax[0].scatter(x1[~s],latente[~s],color='gray',s=9,alpha=.15,label='No observados (solo simulación)');ax[0].scatter(x1[s],y[s],s=10,alpha=.35,label='Observados');gri=np.linspace(x1.min(),x1.max(),100)
ax[0].plot(gri,beta*gri,'k--',label='Media poblacional');ax[0].plot(gri,bs[0]+bs[1]*gri,label='MCO seleccionado');ax[0].plot(gri,bh[0]+bh[1]*gri,label='Poblacional recuperada Heckman');ax[0].set(xlabel='x1',ylabel='y',title='La selección cambia a quién comparamos');ax[0].legend(fontsize=7)
ax[1].scatter(lam[s],u[s],s=10,alpha=.3);gri=np.linspace(lam[s].min(),lam[s].max(),100);ax[1].plot(gri,rho*gri,'k--');ax[1].set(xlabel='Mills estimada',ylabel='Error u (visible solo al simulador)',title='La corrección busca la media del error seleccionado');fig.tight_layout()
print("Conclusión: observar y solo para quienes pasan el filtro puede relacionar x con el error dentro de la muestra seleccionada. Heckman estima primero quién entra y luego incorpora Mills en la ecuación de y. Pon carga=0: desaparece la correlación de errores y, bajo este proceso, MCO seleccionado deja de tener ese sesgo. Las mismas semillas no producen los mismos números en Stata y NumPy; replicamos el proceso, no cada extracción aleatoria.")`
},
{
id:"ic5-mills",title:"10 Clase 5 · La razón de Mills: quién logra pasar el filtro",
description:"Slides 41–44. Para cada índice de selección, simula errores correlacionados y compara E[u|s=1,z] con rho*sigma_u*lambda(z gamma). Cambia rho para invertir el sentido de la selección o eliminarla.",
parameters:String.raw`B,rho,sigma_u=20000,.7,1.5
indices=np.linspace(-2,2,17)`,
code:IC5_BASE+IC5_CORE+String.raw`if not isinstance(B,int) or not 1000<=B<=100000 or abs(rho)>=1 or sigma_u<=0 or len(indices)>40 or np.any(abs(indices)>3): raise ValueError("Usa B 1000–100000, |rho|<1, sigma_u>0 y hasta 40 índices entre -3 y 3.")
v=rng.normal(size=B);u=sigma_u*(rho*v+np.sqrt(1-rho*rho)*rng.normal(size=B));medias=[];tasas=[]
for a in indices:
    s=v>-a
    if s.sum()<20: raise ValueError("Muy pocas personas seleccionadas; aumenta B o reduce el filtro.")
    medias.append(u[s].mean());tasas.append(s.mean())
teoria=rho*sigma_u*mills(indices)
print(pd.DataFrame({'indice':indices,'P entra':norm.cdf(indices),'Mills':mills(indices),'E[u|entra] teórica':teoria,'simulada':medias}).round(4).to_string(index=False))
fig,ax=plt.subplots(1,2,figsize=(10,4.2));ax[0].plot(indices,norm.cdf(indices),label='Probabilidad de entrar');ax[0].plot(indices,mills(indices),label='Razón de Mills');ax[0].set(xlabel='Índice de selección z gamma',title='Mills no es una probabilidad');ax[0].legend(fontsize=8)
ax[1].plot(indices,teoria,label='rho × sigma_u × Mills');ax[1].scatter(indices,medias,label='Media simulada');ax[1].axhline(0,color='gray');ax[1].set(xlabel='Índice de selección',ylabel='Error medio entre seleccionados',title='Un filtro difícil selecciona errores extremos');ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: cuando entrar es difícil, quienes entran necesitan un v especialmente alto. Si u y v están relacionados, también tendrán un u distinto de cero en promedio. Mills resume esa selección bajo normalidad conjunta. Su coeficiente es rho*sigma_u, no rho salvo que sigma_u=1. Cambiar el signo de rho invierte la corrección; con rho=0 su valor poblacional es cero.")`
},
{
id:"ic5-exclusion",title:"11 Clase 5 · Heckman necesita una exclusión creíble",
description:"Slides 40 y 46. Compara una variable z fuerte y válida, otra débil y una que también afecta y. Repite muestras para ver precisión y sesgo. En el último escenario la corrección omite deliberadamente el efecto directo de z.",
parameters:String.raw`n,B,rho,beta,fuerza,efecto_directo=800,100,.7,1.0,1.0,.6`,
code:IC5_BASE+IC5_CORE+IC5_HECK+String.raw`validar_n(n)
if n>2000 or not isinstance(B,int) or not 20<=B<=300 or abs(rho)>=.95 or not .2<=fuerza<=2: raise ValueError("Usa n<=2000, B 20–300, |rho|<.95 y fuerza entre .2 y 2.")
escenarios=[('Válida y fuerte',fuerza,0.),('Válida pero débil',.05,0.),('Exclusión inválida',fuerza,efecto_directo)]
resultados={k:[] for k,_,_ in escenarios};colinealidad={k:[] for k in resultados};fallos={k:0 for k in resultados}
for rep in range(B):
    x=rng.normal(size=n);z=rng.normal(size=n);v=rng.normal(size=n);u=rho*v+np.sqrt(1-rho*rho)*rng.normal(size=n)
    X=np.column_stack([np.ones(n),x]);Z=np.column_stack([X,z])
    for nombre,a,directo in escenarios:
        s=(-.2+.8*x+a*z+v>0);y=np.where(s,1+beta*x+directo*z+u,np.nan)
        try:
            b,g,lam=heckman(X,Z,y,s);_,res,_=ols(X[s],lam[s]);r2=1-(res@res)/np.sum((lam[s]-lam[s].mean())**2)
            resultados[nombre].append(b[1]);colinealidad[nombre].append(r2)
        except ValueError: fallos[nombre]+=1
for k,vv in resultados.items():
    if len(vv)<.9*B: raise ValueError("Demasiados ajustes fallidos; aumenta n o cambia parámetros.")
    print(f"{k}: media beta={np.mean(vv):.4f}; SD={np.std(vv,ddof=1):.4f}; R²(Mills sobre X)={np.mean(colinealidad[k]):.4f}; fallos={fallos[k]}")
fig,ax=plt.subplots(figsize=(10,4.5));ax.boxplot(list(resultados.values()),showfliers=False);ax.set_xticks([1,2,3],list(resultados));ax.axhline(beta,color='C1',ls='--',label='Beta verdadera');ax.set(ylabel='Beta estimada por Heckman',title='Relevancia y validez son requisitos diferentes');ax.legend();fig.tight_layout()
print("Conclusión: una exclusión útil cambia la participación sin cambiar directamente el resultado latente. Si apenas mueve la participación, Mills puede parecerse mucho a X y separar sus efectos es impreciso. Si z también afecta y y la excluimos de esa ecuación, corregir la selección no arregla la variable omitida. Sin exclusión la identificación puede descansar en la no linealidad de la normal, pero suele ser frágil. Ninguna prueba estadística sustituye la justificación económica de la exclusión.")`
},
{
id:"ic5-mroz",title:"12 Clase 5 · MROZ: salarios, participación y Heckman en dos etapas",dataset:"mroz",
description:"Slides 47–51 y Tobit model.do. Reproduce la aplicación con 753 mujeres y 428 salarios observados. Presenta SE corregidos de dos etapas; opcionalmente activa bootstrap, que vuelve a estimar probit y salarios en cada muestra.",
parameters:String.raw`exclusiones=["nwifeinc","age","kidsge6","kidslt6"]
B_boot=0  # 0: SE analíticos corregidos. Prueba 199 o 399 para bootstrap de ambas etapas.`,
code:IC5_BASE+IC5_CORE+IC5_HECK+String.raw`permitidas=['nwifeinc','age','kidsge6','kidslt6']
if not exclusiones or len(set(exclusiones))!=len(exclusiones) or not set(exclusiones)<=set(permitidas) or not isinstance(B_boot,int) or not (B_boot==0 or 99<=B_boot<=499): raise ValueError("Elige exclusiones distintas de la lista y B_boot=0 o 99–499.")
d=pd.read_csv('mroz.csv');n=len(d);s=d.inlf.to_numpy().astype(bool);y=d.lwage.to_numpy();nombres=['constante','educ','exper','expersq'];seln=nombres+exclusiones
if not np.array_equal(np.isfinite(y),s): raise ValueError("La observación de lwage no coincide con inlf.")
X=np.column_stack([np.ones(n),d[['educ','exper','expersq']].to_numpy()]);Z=np.column_stack([X,d[exclusiones].to_numpy()])
b,g,lam,V,Vnaive,sigma,rho=heckman(X,Z,y,s,True);bm,_,_=ols(X[s],y[s]);se=np.sqrt(np.diag(V));pvalor=2*norm.sf(abs(b[-1]/se[-1]))
print(f"n={n}; salarios observados={s.sum()}; no observados={(~s).sum()}; nunca se reemplazan por cero.")
print("Primera etapa: probit de inlf, usa todas las filas.\n",pd.Series(g,index=seln).round(6))
print("Segunda etapa: lwage, no inlf; usa solo los salarios observados.")
print(pd.DataFrame({'Heckman':b,'SE corregido 2 etapas':se,'SE OLS ingenuo':np.sqrt(np.diag(Vnaive))},index=nombres+['Mills']).round(6))
print("MCO sin corrección:\n",pd.Series(bm,index=nombres).round(6))
print(f"sigma={sigma:.5f}; rho={rho:.5f}; coeficiente Mills={b[-1]:.5f}; p asintótico para Mills=0: {pvalor:.5f}")
print("Exclusiones asumidas:",exclusiones,". No se demuestra su validez con esta regresión.")
boot=None
if B_boot:
    filas=[];fallos=0
    for rep in range(B_boot):
        j=rng.integers(0,n,n)
        try: filas.append(heckman(X[j],Z[j],y[j],s[j])[0])
        except ValueError: fallos+=1
    if len(filas)<.95*B_boot: raise ValueError("Más del 5% de muestras bootstrap fallaron; revisar identificación.")
    boot=np.asarray(filas);print(f"Bootstrap válido={len(boot)} de {B_boot}; fallos={fallos}")
    print(pd.DataFrame({'SE bootstrap':boot.std(axis=0,ddof=1),'Percentil 2.5':np.quantile(boot,.025,axis=0),'Percentil 97.5':np.quantile(boot,.975,axis=0)},index=nombres+['Mills']).round(6))
    print("Los intervalos bootstrap son aproximados y fluctúan con B; se remuestrean las 753 filas completas, no solo trabajadoras.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));prob=norm.cdf(Z@g)
ax[0].hist(prob[~s],bins=20,alpha=.5,label='No participa');ax[0].hist(prob[s],bins=20,alpha=.5,label='Participa');ax[0].set(xlabel='Probabilidad estimada de participar',ylabel='Personas',title='Probit usa también a las no participantes');ax[0].legend(fontsize=8)
ax[1].errorbar([b[-1]],[0],xerr=[1.96*se[-1]],fmt='o',capsize=5,label='IC95% corregido de Mills');ax[1].axvline(0,color='gray',ls='--');ax[1].set(yticks=[],xlabel='Coeficiente de Mills = rho × sigma',title='¿Hay evidencia de selección en este modelo?');ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión:","no rechazamos un coeficiente de Mills igual a cero al 5%; eso no prueba ausencia de selección." if pvalor>=.05 else "rechazamos un coeficiente de Mills igual a cero al 5% bajo estos supuestos.")
print("En la especificación original, educación y experiencia cambian poco al corregir. Los SE de OLS de la segunda etapa no son los SE válidos de Heckman: Mills fue estimada y el error seleccionado cambia de varianza. La covarianza corregida y el bootstrap consideran ambas etapas. La edad en MROZ está en años; las exclusiones afectan participación y se supone que no afectan directamente la oferta salarial. Son asociaciones históricas de 1975, no efectos causales demostrados.")`
}
);
IC5_LABS.sort((a,b)=>a.title.localeCompare(b.title)).forEach(example=>{
  example.code=IC5_BASE+"\n# PARÁMETROS QUE PUEDES CAMBIAR\n"+example.parameters+"\n\n"+example.code.slice(IC5_BASE.length);
  ECON_PYTHON_EXAMPLES.push({...example,course:"inferencia-causal",classNumber:5,filename:example.title+".py"});
});
