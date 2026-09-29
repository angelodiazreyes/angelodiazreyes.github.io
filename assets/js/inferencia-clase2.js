// Clase 2: VI. Cada código mostrado contiene sus funciones y se ejecuta por separado.
const IC2_IMPORTS = String.raw`import numpy as np
import matplotlib.pyplot as plt
from math import erfc, sqrt
rng=np.random.default_rng(123)
np.set_printoptions(precision=3, suppress=True)
`;
const IC2_MC = String.raw`
# Cada fila es una muestra distinta. B=muestras repetidas; n=personas por muestra.
if not isinstance(n,int) or not isinstance(B,int) or n<10 or B<2 or n*B>3000000:
    raise ValueError("Usa enteros n>=10, B>=2 y n*B<=3 millones.")
def centrar(a): return a-a.mean(axis=-1,keepdims=True)
def pendiente(x,y):
    xc,yc=centrar(x),centrar(y)
    return np.sum(xc*yc,axis=-1)/np.sum(xc**2,axis=-1)
def iv(z,x,y):
    zc=centrar(z);den=np.sum(zc*centrar(x),axis=-1)
    if np.any(abs(den)<1e-12): raise ValueError("Cov(z,x) casi cero: IV no está identificado en alguna muestra.")
    return np.sum(zc*centrar(y),axis=-1)/den
def comparar(series,verdad,titulo):
    fig,ax=plt.subplots(figsize=(9,4))
    for nombre,estimaciones in series.items():
        ax.hist(estimaciones,bins=45,density=True,histtype="step",label=nombre)
        print(f"{nombre}: mediana={np.median(estimaciones):.3f}; percentiles 5 y 95={np.quantile(estimaciones,[.05,.95])}")
    ax.axvline(verdad,color="black",ls="--",label="Efecto verdadero")
    ax.set(xlabel="Pendiente estimada",ylabel="Densidad",title=titulo)
    ax.legend();fig.tight_layout()
`;
const IC2_2SLS = String.raw`
def mco(X,y): return np.linalg.lstsq(X,y,rcond=None)[0]
def dos_etapas(X,y,Z):
    if len(y)<=X.shape[1] or np.linalg.matrix_rank(Z)<Z.shape[1]:
        raise ValueError("Faltan observaciones o hay instrumentos redundantes.")
    Xh=Z@mco(Z,X)
    if np.linalg.matrix_rank(Xh)<X.shape[1]: raise ValueError("No hay suficiente variación instrumental para identificar el modelo.")
    beta=mco(Xh,y)
    return beta,Xh,y-X@beta  # Residuo estructural: usa X, no Xh
`;
const IC_CLASS2 = [
  {
    id:"ic2-omitida", title:"01 Clase 2 · Problema variable omitida",
    description:"Slides 2–8 y 22–26. Educación x y log-salario y hipotéticos. Habilidad h afecta a ambos. Cambia gamma (efecto de habilidad en y) y a (relación de habilidad con x).",
    code:IC2_IMPORTS+String.raw`n,B,beta,a,gamma,pi=500,600,.10,1.0,.30,1.0
`+IC2_MC+String.raw`
z,h,v,e=rng.normal(size=(4,B,n))
x=12+pi*z+a*h+v
y=1+beta*x+gamma*h+e
corto=pendiente(x,y)
# Solo en la simulación conocemos h: sirve como referencia observable ideal.
xr=centrar(x)-pendiente(h,x)[:,None]*centrar(h)
yr=centrar(y)-pendiente(h,y)[:,None]*centrar(h)
completo=pendiente(xr,yr)
limite=beta+gamma*a/(pi**2+a**2+1)
print(f"Límite MCO omitiendo habilidad={limite:.3f}; beta verdadero={beta}")
comparar({"Omite habilidad":corto,"Controla habilidad (referencia)":completo},beta,"MCO atribuye a educación parte del efecto de habilidad")
print("Conclusión: si quienes estudian más también tienen mayor habilidad y esta eleva el salario, la recta mezcla ambos efectos. Cambia a o gamma a cero: omitir una variable solo crea este sesgo si conecta x con y por otra vía. Conocer h aquí es una ventaja artificial del simulador.")`
  },
  {
    id:"ic2-omitida-iv", title:"02 Clase 2 · Variable omitida: instrumento válido",
    description:"Slides 9–10 y 18–29. Mismo modelo que 01. z es un estímulo hipotético asignado al azar que cambia educación y no afecta al salario por otra vía. pi controla su relevancia.",
    code:IC2_IMPORTS+String.raw`n,B,beta,a,gamma,pi=500,600,.10,1.0,.30,1.0
if abs(pi)<.01: raise ValueError("Usa |pi|>=.01; para debilidad, abre el ejercicio 09.")
`+IC2_MC+String.raw`
z,h,v,e=rng.normal(size=(4,B,n))
x=12+pi*z+a*h+v;y=1+beta*x+gamma*h+e
comparar({"MCO":pendiente(x,y),"IV con z":iv(z,x,y)},beta,"IV usa la variación de educación generada por z")
print(f"Primera etapa poblacional: efecto de z en x={pi}; efecto de z en y={beta*pi:.3f}; cociente={beta:.3f}")
print("Conclusión: z mueve educación sin mover habilidad. Comparar ese cambio en educación con el cambio en salario permite aislar el efecto buscado. IV necesita relevancia y ausencia de otras vías hacia y; no basta con llamar instrumento a una variable. Es consistente bajo estos supuestos, pero no tiene por qué acertar ni ser insesgado en muestras pequeñas.")`
  },
  {
    id:"ic2-medicion", title:"03 Clase 2 · Problema error de medición",
    description:"Slides 4 y 40. x_real es una magnitud centrada, medida con ruido independiente: x_observada=x_real+error. Cambia sd_error. La atenuación hacia cero corresponde a este error clásico en una regresión simple.",
    code:IC2_IMPORTS+String.raw`n,B,beta,sd_error=500,600,2.0,1.5
if sd_error<0: raise ValueError("sd_error debe ser no negativo.")
`+IC2_MC+String.raw`
x_real,u,e=rng.normal(size=(3,B,n))
x_obs=x_real+sd_error*e;y=1+beta*x_real+u
print(f"Límite MCO con x observada={beta/(1+sd_error**2):.3f}; verdadero={beta}")
comparar({"x verdadera (referencia)":pendiente(x_real,y),"x con error":pendiente(x_obs,y)},beta,"El ruido en x diluye la relación")
print("Conclusión: parte de las diferencias que vemos en x son errores de registro que no vienen acompañados de cambios en y. La recta se aplana hacia cero. Aumentar n hace más precisa esa respuesta equivocada; reducir el error de medición recupera señal. Otros tipos de error de medición no siempre producen atenuación.")`
  },
  {
    id:"ic2-medicion-iv", title:"04 Clase 2 · Error de medición: segunda medición como IV",
    description:"Slides 4, 10 y 40. Dos mediciones de la misma x real. La segunda puede instrumentar a la primera si sus errores son independientes entre sí, de x real y del error de y. Cambia rho_errores para romper el supuesto.",
    code:IC2_IMPORTS+String.raw`n,B,beta,sd_error,rho_errores=500,600,2.0,1.5,0.0
if sd_error<0 or not -1<=rho_errores<=1: raise ValueError("Usa sd_error>=0 y |rho_errores|<=1.")
if abs(1+rho_errores*sd_error**2)<1e-8: raise ValueError("El instrumento pierde relevancia: Cov(z,x_obs)=0.")
`+IC2_MC+String.raw`
x_real,u,e1,e2=rng.normal(size=(4,B,n))
x_obs=x_real+sd_error*e1
z=x_real+sd_error*(rho_errores*e1+np.sqrt(1-rho_errores**2)*e2)
y=1+beta*x_real+u
limite=beta/(1+rho_errores*sd_error**2)
print(f"Límite IV={limite:.3f}; Cov(z,error estructural observado)={-beta*rho_errores*sd_error**2:.3f}")
comparar({"MCO":pendiente(x_obs,y),"IV segunda medición":iv(z,x_obs,y)},beta,"Dos mediciones pueden compartir señal sin compartir ruido")
print("Conclusión: con errores independientes, lo que ambas mediciones comparten es la x verdadera, y IV aprovecha esa señal común. Si ambas repiten el mismo error, también comparten ruido y la corrección deja de ser válida. Una segunda medición no es automáticamente un buen instrumento.")`
  },
  {
    id:"ic2-simultanea", title:"05 Clase 2 · Problema causalidad simultánea",
    description:"Slides 5 y 40. Mercado hipotético: demanda Q=10-b*P+u; oferta Q=2+d*P-s*z+v. Precio y cantidad se determinan conjuntamente. z es un costo que desplaza oferta. Cambia sd_u y sd_v.",
    code:IC2_IMPORTS+String.raw`n,B,b,d,s,sd_u,sd_v=500,600,1.0,1.0,1.0,2.0,1.0
if min(b,d)<=0 or min(sd_u,sd_v)<0: raise ValueError("Usa b,d>0 y desviaciones>=0.")
`+IC2_MC+String.raw`
z,eu,ev=rng.normal(size=(3,B,n));u=sd_u*eu;v=sd_v*ev
precio=(8+s*z+u-v)/(b+d)
cantidad=10-b*precio+u
limite=-b+(b+d)*sd_u**2/(s**2+sd_u**2+sd_v**2)
print(f"Pendiente causal de demanda={-b}; límite MCO={limite:.3f}")
comparar({"MCO cantidad sobre precio":pendiente(precio,cantidad)},-b,"Equilibrios de mercado no trazan una demanda fija")
print("Conclusión: cuando sube la demanda por un motivo no observado, aumentan tanto precio como cantidad. MCO puede interpretar ese movimiento como un efecto positivo del precio, aunque una subida del precio reduzca la cantidad demandada. Los puntos mezclan desplazamientos de oferta y demanda.")`
  },
  {
    id:"ic2-simultanea-iv", title:"06 Clase 2 · Simultaneidad: instrumento de oferta",
    description:"Slides 5, 10 y 40. Mismo mercado de 05. Un costo z mueve la oferta y el precio, pero es independiente del shock de demanda y no entra directamente en demanda.",
    code:IC2_IMPORTS+String.raw`n,B,b,d,s,sd_u,sd_v=500,600,1.0,1.0,1.0,2.0,1.0
if min(b,d)<=0 or min(sd_u,sd_v)<0 or abs(s)<.01: raise ValueError("Usa b,d>0, desviaciones>=0, |s|>=.01.")
`+IC2_MC+String.raw`
z,eu,ev=rng.normal(size=(3,B,n));u=sd_u*eu;v=sd_v*ev
precio=(8+s*z+u-v)/(b+d);cantidad=10-b*precio+u
comparar({"MCO":pendiente(precio,cantidad),"IV con costo z":iv(z,precio,cantidad)},-b,"Mover oferta permite aprender sobre demanda")
print(f"Efecto z sobre precio={s/(b+d):.3f}; efecto sobre cantidad={-b*s/(b+d):.3f}")
print("Conclusión: el costo empuja el precio desde el lado de la oferta. Si no cambia las preferencias de los compradores, observamos cómo la demanda responde a ese movimiento del precio. El instrumento identifica aquí la pendiente de demanda, no la de oferta. Su validez depende de que z no afecte la demanda por otra vía.")`
  },
  {
    id:"ic2-etapas", title:"07 Clase 2 · IV y dos etapas: matrices editables",
    description:"Slides 18–29. Modifica los vectores x, y y z. Compara Cov(z,y)/Cov(z,x), (Z′X)⁻¹Z′y y 2SLS. La igualdad numérica no demuestra que el instrumento sea causalmente válido.",
    code:IC2_IMPORTS+String.raw`x=np.array([1,3,2,5,4,7,6,9.],float)
y=np.array([3,5,6,8,9,12,11,16.],float)
z=np.array([0,1,1,2,3,3,4,5.],float)
if x.ndim!=1 or y.shape!=x.shape or z.shape!=x.shape or len(x)<3: raise ValueError("Usa vectores de igual longitud, con al menos 3 filas.")
`+IC2_2SLS+String.raw`
X=np.column_stack([np.ones(len(x)),x]);Z=np.column_stack([np.ones(len(x)),z])
beta,Xh,res=dos_etapas(X,y,Z)
zc=z-z.mean();xc=x-x.mean();yc=y-y.mean()
ratio=(zc@yc)/(zc@xc)
exacta=np.linalg.solve(Z.T@X,Z.T@y)
for nombre,A in [("X",X),("Z",Z),("y",y),("Z'X",Z.T@X),("Z'y",Z.T@y),("X predicha",Xh),("X'PzX",Xh.T@Xh)]: print(nombre,"=\n",A)
print("IV matricial:",exacta,"; 2SLS:",beta,"; cociente:",ratio)
print("Primera etapa [constante, z]:",mco(Z,x))
fig,ax=plt.subplots(1,2,figsize=(10,4))
orden=np.argsort(z);ax[0].scatter(z,x);ax[0].plot(z[orden],Xh[orden,1],color="C1")
ax[0].set(xlabel="z",ylabel="x",title="Primera etapa: predecir x con z")
orden=np.argsort(Xh[:,1]);ax[1].scatter(Xh[:,1],y);ax[1].plot(Xh[orden,1],(Xh@beta)[orden],color="C1")
ax[1].set(xlabel="x predicha por z",ylabel="y",title="Segunda etapa: y sobre x predicha")
fig.tight_layout()
print("Conclusión: las dos etapas y el cociente de covarianzas usan la misma variación y entregan la misma pendiente en este caso. Predecir x no crea por sí solo exogeneidad: la interpretación causal exige justificar z. Si z=x, la fórmula coincide con MCO y conserva cualquier problema de endogeneidad de x.")`
  },
  {
    id:"ic2-wald", title:"08 Clase 2 · Intuición IV: efecto reducido dividido por primera etapa",
    description:"Extensión de slides 18–29: instrumento binario aleatorio en un modelo de efecto constante. Compara promedios entre z=1 y z=0. No se presume que un instrumento real sea válido sin justificarlo.",
    code:IC2_IMPORTS+String.raw`n,beta,pi=3000,2.0,1.0
if n<10 or abs(pi)<.01: raise ValueError("Usa n>=10 y |pi|>=.01.")
z=rng.binomial(1,.5,n);h,v,e=rng.normal(size=(3,n))
if z.min()==z.max(): raise ValueError("Falta uno de los grupos z.")
x=pi*z+h+v;y=1+beta*x+h+e
mx=np.array([x[z==j].mean() for j in [0,1]])
my=np.array([y[z==j].mean() for j in [0,1]])
dx=mx[1]-mx[0];dy=my[1]-my[0]
if abs(dx)<1e-10: raise ValueError("Primera etapa nula: no se puede dividir.")
print(f"Primera etapa: cambio en x={dx:.3f}; forma reducida: cambio en y={dy:.3f}")
print(f"Wald=Delta y / Delta x={dy/dx:.3f}; efecto verdadero={beta}")
fig,ax=plt.subplots(1,2,figsize=(9,4))
for eje,medias,titulo in [(ax[0],mx,"Primera etapa: x"),(ax[1],my,"Forma reducida: y")]:
    eje.bar([0,1],medias);eje.set(xticks=[0,1],xlabel="Asignación z",ylabel="Media del grupo",title=titulo)
fig.tight_layout()
print("Conclusión: el instrumento provoca cierto cambio en x y observamos cuánto cambia y. Dividir ambos cambios traduce el efecto de la asignación a unidades de x. Si z afecta y directamente, el numerador incluye otro efecto y el cociente ya no aísla beta.")`
  },
  {
    id:"ic2-debil", title:"09 Clase 2 · Instrumento débil: dividir por poca señal",
    description:"Slides 24–25 y 30–33. Compara fuerzas pi del instrumento. Se muestran TODOS los valores extremos con escala simétrica logarítmica. F es la F clásica de primera etapa con un instrumento; no prueba validez.",
    code:IC2_IMPORTS+String.raw`n,B,beta=300,600,2.0
pis=[1.0,.3,.1,.02,0.0]
`+IC2_MC+String.raw`
z,v,e=rng.normal(size=(3,B,n));u=.7*v+e
estimaciones=[]
for pi in pis:
    x=pi*z+v;y=1+beta*x+u
    estimacion=iv(z,x,y);estimaciones.append(estimacion)
    zc=centrar(z);xc=centrar(x);pihat=pendiente(z,x)
    rss=np.sum((xc-pihat[:,None]*zc)**2,axis=1)
    F=pihat**2*np.sum(zc**2,axis=1)/(rss/(n-2))
    print(f"pi={pi}: mediana IV={np.median(estimacion):.3f}; p5,p95={np.quantile(estimacion,[.05,.95])}; F mediana={np.median(F):.2f}; fracción F<10={np.mean(F<10):.2f}")
fig,ax=plt.subplots(figsize=(9,4))
ax.boxplot(estimaciones,showfliers=True);ax.set_xticks(np.arange(1,len(pis)+1),[str(p) for p in pis])
ax.set_yscale("symlog",linthresh=2);ax.axhline(beta,color="C1",ls="--")
ax.set(xlabel="Fuerza poblacional pi",ylabel="Estimación IV (escala symlog)",title="La exogeneidad sola no garantiza información suficiente")
fig.tight_layout()
print("Conclusión: cuando z apenas mueve x, dividimos por una señal pequeña y el ruido puede disparar la estimación. Con pi=0 no hay identificación poblacional, aunque el computador devuelva un cociente muestral. F<10 es una alerta orientativa, no una regla universal; F grande tampoco verifica exclusión. Por las colas extremas se reportan medianas y cuantiles, no una supuesta media estable de IV.")`
  },
  {
    id:"ic2-invalido", title:"10 Clase 2 · Instrumento inválido: otra vía hacia y",
    description:"Slides 10–17 y 24–26. delta es un efecto directo de z sobre y, que viola exclusión al instrumentar x. Cambia delta y observa cómo la debilidad amplifica el error.",
    code:IC2_IMPORTS+String.raw`n,B,beta,delta=1000,400,2.0,.2
pis=[1.0,.5,.2]
`+IC2_MC+String.raw`
z,v,e=rng.normal(size=(3,B,n))
medianas=[];limites=[]
for pi in pis:
    if abs(pi)<1e-10: raise ValueError("pi no puede ser cero en esta comparación de límites.")
    x=pi*z+v;y=1+beta*x+.7*v+delta*z+e
    b=iv(z,x,y);medianas.append(np.median(b));limites.append(beta+delta/pi)
    print(f"pi={pi}: mediana IV={np.median(b):.3f}; límite={beta+delta/pi:.3f}; mediana MCO={np.median(pendiente(x,y)):.3f}")
fig,ax=plt.subplots(figsize=(8,4));j=np.arange(len(pis))
ax.plot(j,medianas,"o-",label="Mediana simulada IV");ax.plot(j,limites,"s--",label="Límite beta+delta/pi")
ax.axhline(beta,color="black",label="Efecto verdadero");ax.set_xticks(j,[str(p) for p in pis])
ax.set(xlabel="Fuerza pi",ylabel="Pendiente",title="Una pequeña vía directa puede producir un gran error")
ax.legend();fig.tight_layout()
print("Conclusión: IV atribuye a x todo el cambio en y provocado por z. Si z también cambia y por otra vía, se le atribuye a x un efecto que no le corresponde. Cuanto menos mueve z a x, más se amplifica esa contaminación. Pon delta=0 para recuperar un instrumento válido en este modelo.")`
  },
  {
    id:"ic2-controles", title:"11 Clase 2 · Controles y varios instrumentos: 2SLS matricial",
    description:"Slides 27 y 34–47. w es un control exógeno incluido en ambas etapas; z1 y z2 son instrumentos excluidos. Modifica pi1 y pi2. Se muestran las matrices y la F parcial conjunta.",
    code:IC2_IMPORTS+String.raw`n,beta,pi1,pi2=1000,2.0,1.0,.7
if n<10 or pi1**2+pi2**2<1e-8: raise ValueError("Usa n>=10 y al menos un instrumento relevante.")
`+IC2_2SLS+String.raw`
w,z1,z2,v,e=rng.normal(size=(5,n))
x=.8*w+pi1*z1+pi2*z2+v;y=1+beta*x+.5*w+.7*v+e
X=np.column_stack([np.ones(n),x,w]);Z=np.column_stack([np.ones(n),w,z1,z2])
b,Xh,res=dos_etapas(X,y,Z);ols=mco(X,y)
R=Z[:,:2];rss_r=np.sum((x-R@mco(R,x))**2);rss_u=np.sum((x-Xh[:,1])**2)
F=((rss_r-rss_u)/2)/(rss_u/(n-4))
print("Primeras 6 filas X=[1,x,w]:\n",X[:6],"\nZ=[1,w,z1,z2]:\n",Z[:6])
print("Z'X/n:\n",Z.T@X/n,"\nX'PzX/n:\n",Xh.T@Xh/n,"\nX'Pzy/n:\n",Xh.T@y/n)
print("MCO [constante,x,w]:",ols,"; 2SLS:",b,"; verdad:",[1,beta,.5])
print(f"F parcial conjunta de z1,z2, controlando w={F:.2f}")
fig,ax=plt.subplots(figsize=(8,4));j=np.arange(3)
ax.bar(j-.18,ols,.36,label="MCO");ax.bar(j+.18,b,.36,label="2SLS");ax.scatter(j,[1,beta,.5],color="black",label="Verdad")
ax.set(xticks=j,xticklabels=["Constante","x","w"],ylabel="Coeficiente",title="Controlar w y usar la información de z1 y z2")
ax.legend();fig.tight_layout()
print("Conclusión: los controles deben acompañar a los instrumentos en la primera etapa y permanecer en la ecuación final. Que w prediga x no basta para usarlo como instrumento excluido si w también afecta y. z1 y z2 aportan variación adicional, una vez descontado w; su validez sigue siendo un supuesto sustantivo.")`
  },
  {
    id:"ic2-se", title:"12 Clase 2 · Dos etapas: mismos coeficientes, distintos errores estándar",
    description:"Slide 44. Compara el error estándar ingenuo de y sobre x predicha con el de IV homocedástico y robusto HC1. hetero=0 genera homocedasticidad; prueba hetero=1.",
    code:IC2_IMPORTS+String.raw`n,beta,pi,hetero=2000,2.0,1.0,0.0
if n<10 or abs(pi)<.01 or hetero<0: raise ValueError("Usa n>=10, |pi|>=.01, hetero>=0.")
`+IC2_2SLS+String.raw`
z,v,e=rng.normal(size=(3,n));x=pi*z+v
u=.7*v+(1+hetero*abs(z))*e;y=1+beta*x+u
X=np.column_stack([np.ones(n),x]);Z=np.column_stack([np.ones(n),z])
b,Xh,res=dos_etapas(X,y,Z)
Ainv=np.linalg.inv(Xh.T@Xh)
ingenuo=y-Xh@b
V_naive=(ingenuo@ingenuo)/(n-2)*Ainv
V_homo=(res@res)/(n-2)*Ainv
scores=Xh*res[:,None]
V_hc1=n/(n-2)*Ainv@(scores.T@scores)@Ainv
se=np.sqrt([V_naive[1,1],V_homo[1,1],V_hc1[1,1]])
print(f"Pendiente 2SLS={b[1]:.4f}; verdad={beta}")
print("SE [ingenuo, IV homocedástico, IV HC1]:",se)
fig,ax=plt.subplots(figsize=(9,4));j=np.arange(3)
ax.errorbar(j,np.repeat(b[1],3),yerr=1.96*se,fmt="o",capsize=6)
ax.axhline(beta,color="C1",ls="--");ax.set_xticks(j,["Ingenuo (incorrecto)","IV homocedástico","IV robusto HC1"])
ax.set(ylabel="Pendiente e intervalo normal 95%",title="La incertidumbre debe usar el residuo estructural")
fig.tight_layout()
print("Conclusión: la segunda etapa manual reproduce el coeficiente, pero su error estándar ordinario mide la variabilidad de una ecuación distinta. Para IV calculamos residuos con x observada, y-X*beta, no con x predicha. Aquí el ingenuo puede ser mayor: el error no tiene una dirección universal. HC1 permite heterocedasticidad con observaciones independientes e instrumento fuerte; no corrige instrumentos débiles o inválidos.")`
  },
  {
    id:"ic2-dwh", title:"13 Clase 2 · Prueba de endogeneidad: Durbin–Wu–Hausman",
    description:"Slides 48–52. Versión por inclusión del residuo de primera etapa, con contraste asintótico chi-cuadrado de 1 grado. rho controla Cov(x,u). Requiere instrumento válido; se simulan errores homocedásticos normales.",
    code:IC2_IMPORTS+String.raw`n,B,beta,rho=500,300,2.0,.6
if n<10 or B<2 or n*B>1000000 or not -1<rho<1: raise ValueError("Usa n>=10,B>=2,n*B<=1 millón, |rho|<1.")
`+IC2_2SLS+String.raw`
pvalores=[];diferencias=[]
for _ in range(B):
    z,v,e=rng.normal(size=(3,n));x=z+v;u=rho*v+np.sqrt(1-rho**2)*e;y=1+beta*x+u
    X=np.column_stack([np.ones(n),x]);Z=np.column_stack([np.ones(n),z])
    r=x-Z@mco(Z,x);W=np.column_stack([X,r]);c=mco(W,y);res=y-W@c
    V=(res@res)/(n-3)*np.linalg.inv(W.T@W)
    stat=c[-1]**2/V[-1,-1];pvalores.append(erfc(sqrt(stat/2)))
    diferencias.append(dos_etapas(X,y,Z)[0][1]-mco(X,y)[1])
print(f"rho={rho}; proporción de rechazos al 5%={np.mean(np.array(pvalores)<.05):.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].hist(diferencias,bins=30);ax[0].axvline(0,color="C1");ax[0].set(xlabel="IV - MCO",ylabel="Frecuencia",title="¿Cuentan la misma historia?")
ax[1].hist(pvalores,bins=np.linspace(0,1,21));ax[1].axvline(.05,color="C1");ax[1].set(xlabel="p-valor asintótico",ylabel="Frecuencia",title="H0: x es exógena")
fig.tight_layout()
print("Conclusión: si la parte de x que el instrumento no explica ayuda a predecir y, sospechamos endogeneidad. Con rho=0 habrá rechazos por azar; con rho distinto de cero la prueba puede detectar el problema. No rechazar no prueba exogeneidad, y un instrumento inválido puede hacer engañosa esta comparación.")`
  },
  {
    id:"ic2-sargan", title:"14 Clase 2 · Sobreidentificación: prueba de Sargan",
    description:"Slides 53–57. Dos instrumentos para una x endógena. delta permite que z2 afecte y directamente. Sargan nR² usa residuos estructurales y homocedasticidad bajo H0; no es Hansen robusto.",
    code:IC2_IMPORTS+String.raw`n,B,beta,delta=500,300,2.0,0.0
if n<10 or B<2 or n*B>1000000: raise ValueError("Usa n>=10,B>=2,n*B<=1 millón.")
`+IC2_2SLS+String.raw`
pvalores=[];estimaciones=[]
for _ in range(B):
    z1,z2,v,e=rng.normal(size=(4,n));x=z1+z2+v
    y=1+beta*x+.7*v+e+delta*z2
    X=np.column_stack([np.ones(n),x]);Z=np.column_stack([np.ones(n),z1,z2])
    b,Xh,res=dos_etapas(X,y,Z)
    aux=res-Z@mco(Z,res);R2=1-(aux@aux)/np.sum((res-res.mean())**2)
    J=n*max(0,R2);pvalores.append(erfc(sqrt(J/2)))  # 3 columnas Z - 2 columnas X = 1 grado
    estimaciones.append(b[1])
print(f"delta={delta}; rechazos al 5%={np.mean(np.array(pvalores)<.05):.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].hist(estimaciones,bins=30);ax[0].axvline(beta,color="C1");ax[0].set(xlabel="Pendiente 2SLS",ylabel="Frecuencia",title="Estimaciones con ambos instrumentos")
ax[1].hist(pvalores,bins=np.linspace(0,1,21));ax[1].axvline(.05,color="C1");ax[1].set(xlabel="p-valor Sargan",ylabel="Frecuencia",title="¿Son compatibles las restricciones adicionales?")
fig.tight_layout()
print("Conclusión: con instrumentos adicionales podemos comprobar si sus restricciones son compatibles con una misma ecuación. Prueba delta=.5: z2 tiene otra vía hacia y y suele aparecer conflicto. Rechazar indica un problema en las restricciones o el modelo, pero no identifica cuál instrumento falla. No rechazar no certifica validez: instrumentos inválidos pueden coincidir o la prueba tener poca potencia. Con un solo instrumento excluido y una x endógena no hay restricciones sobrantes para esta prueba.")`
  },
  {
    id:"ic2-consistencia", title:"15 Clase 2 · Más datos: precisión versus consistencia",
    description:"Slides 20 y 24–25. Compara MCO, IV válido e IV inválido al aumentar n. Las cajas muestran también valores extremos. Mantén pi fuerte para observar claramente la concentración.",
    code:IC2_IMPORTS+String.raw`n,B,beta,pi,delta=100,400,2.0,1.0,.4
tamanos=[50,200,1000]
if not tamanos or min(tamanos)<10 or max(tamanos)*B>3000000 or abs(pi)<.01: raise ValueError("Usa tamaños>=10, B*max(tamaños)<=3 millones y |pi|>=.01.")
`+IC2_MC+String.raw`
fig,ax=plt.subplots(1,3,figsize=(12,4));grupos=[[],[],[]]
for n in tamanos:
    z,v,e=rng.normal(size=(3,B,n));x=pi*z+v;y=1+beta*x+.7*v+e
    for lista,b in zip(grupos,[pendiente(x,y),iv(z,x,y),iv(z,x,y+delta*z)]): lista.append(b)
limites=[beta+.7/(pi**2+1),beta,beta+delta/pi]
for eje,datos,titulo,limite in zip(ax,grupos,["MCO endógeno","IV válido","IV inválido"],limites):
    eje.boxplot(datos,showfliers=True);eje.set_xticks(np.arange(1,len(tamanos)+1),tamanos)
    eje.axhline(beta,color="black",ls="--",label="Verdad");eje.axhline(limite,color="C1",label="Límite")
    eje.set(xlabel="n por muestra",ylabel="Pendiente",title=titulo);eje.legend(fontsize=8)
    print(titulo,"límite:",limite,"; medianas:",[round(float(np.median(v)),3) for v in datos])
fig.tight_layout()
print("Conclusión: más datos estrechan la distribución, pero no deciden dónde se concentra. IV válido apunta al efecto verdadero; MCO endógeno e IV inválido pueden dar respuestas cada vez más precisas alrededor de valores equivocados. La validez del diseño importa tanto como el tamaño de muestra.")`
  }
];
IC_CLASS2.forEach(example => ECON_PYTHON_EXAMPLES.push({
  ...example, course:"inferencia-causal", filename:example.title
}));
