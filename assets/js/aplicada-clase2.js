// Clase 2: variables continuas. Cada ejemplo se ejecuta de forma independiente.
const VAC_LABS = [
  {
    id: "vac-area", title: "01 Clase 2 · Densidad no es probabilidad",
    description: "Slides 10–19. Cambia el soporte [a,b] y el intervalo [c,d]. El área sombreada y la diferencia de la CDF deben coincidir. Prueba b=1/3: la altura puede superar uno.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
a,b,c,d,n=0.0,1/3,0.1,0.2,10000  # Puede cambiar
if not a<b or not c<d or n<1: raise ValueError("Usa a<b, c<d y n>=1.")
F=lambda x: np.clip((np.asarray(x)-a)/(b-a),0,1)
prob=float(F(d)-F(c))
x=rng.uniform(a,b,n)
print(f"Altura=1/(b-a)={1/(b-a):.3f}; área total=1")
print(f"P(c<=X<=d)=F(d)-F(c)={prob:.4f}; simulada={np.mean((x>=c)&(x<=d)):.4f}")
grid=np.linspace(min(a,c)-(b-a)*.2,max(b,d)+(b-a)*.2,800)
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].plot([a,a,b,b],[0,1/(b-a),1/(b-a),0])
lo,hi=max(a,c),min(b,d)
if lo<hi: ax[0].fill_between([lo,hi],1/(b-a),alpha=.3,label=f"Área={prob:.3f}"); ax[0].legend()
ax[0].set(xlim=(grid[0],grid[-1]),xlabel="Valor de X",ylabel="Densidad",title="La altura no es una probabilidad")
ax[1].plot(grid,F(grid));ax[1].scatter([c,d],[F(c),F(d)],color="C1")
ax[1].vlines([c,d],0,[F(c),F(d)],linestyles="--",color="C1")
ax[1].set(xlabel="Umbral",ylabel="Probabilidad acumulada",title=f"Diferencia de alturas = {prob:.3f}")
fig.tight_layout()
print("Conclusión: una barra alta no significa una probabilidad mayor que uno. Lo que cuenta es altura por ancho: un intervalo estrecho puede tener poca probabilidad aunque su densidad sea alta. Fuera del soporte no se agrega área.")`
  },
  {
    id: "vac-redondeo", title: "02 Clase 2 · Esperar exactamente 5 minutos",
    description: "Slides 5–11 y 20. Un valor exacto no es lo mismo que una medición redondeada. Cambia el punto y el ancho del intervalo; observa cómo su probabilidad se reduce.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
a,b,punto,n=0.0,10.0,5.0,20000 # Tiempo de espera entre [0,10]; punto especifico que queremos estudiar; numero de tiempos de espera simulados
anchos=np.array([2.0,1.0,.5,.1,.01])  # Puede modificar valores: precisión de medición
if not a<b or n<1 or np.any(anchos<=0): raise ValueError("Usa a<b, n>=1 y anchos positivos.")
t=rng.uniform(a,b,n)
teoria=np.maximum(0,np.minimum(b,punto+anchos/2)-np.maximum(a,punto-anchos/2))/(b-a)
sim=np.array([np.mean((t>=punto-h/2)&(t<punto+h/2)) for h in anchos])
print("Ancho    Probabilidad teórica    Frecuencia")
for h,p,s in zip(anchos,teoria,sim): print(f"{h:6.3f}     {p:9.5f}             {s:.5f}")
print("En el modelo continuo P(T=punto)=0. La simulación usa números de precisión finita; no prueba esa igualdad.")
fig,ax=plt.subplots(figsize=(8,4))
j=np.arange(len(anchos))
ax.bar(j-.18,teoria,.36,label="Modelo continuo");ax.bar(j+.18,sim,.36,label="Simulación")
ax.set(xticks=j,xticklabels=anchos,xlabel="Ancho del intervalo alrededor del punto (min)",ylabel="Probabilidad",title="Más precisión: menos valores caben en el intervalo")
ax.legend();fig.tight_layout()
print("Conclusión: registrar 5 minutos al redondear al minuto significa esperar entre 4.5 y 5.5, no exactamente 5. Cuando el intervalo se estrecha, su probabilidad disminuye; un punto aislado no tiene ancho ni área. Va aumentando la probabilidad si es que aumenta el intervalo")`
  },
  {
    id: "vac-cuantiles", title: "03 Clase 2 · Cuantiles: elegir el umbral",
    description: "Slides 21–29 y 45. Cambia p: ¿qué valor deja esa proporción a su izquierda? Compara una uniforme y una normal hipotéticas, con su cola restante.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
from statistics import NormalDist
rng=np.random.default_rng(123)
a,b,mu,sigma,p,n=20.0,80.0,100.0,15.0,.95,10000 # valores Distr. Uniforme y Distr. Normal; percentil 95; observaciones
if not a<b or sigma<=0 or not 0<p<1 or n<1: raise ValueError("Usa a<b, sigma>0, 0<p<1, n>=1.")
normal=NormalDist(mu,sigma)
qu=a+p*(b-a);qn=normal.inv_cdf(p)
u=rng.uniform(a,b,n);v=rng.normal(mu,sigma,n)
print(f"Uniforme: cuantil teórico={qu:.2f}; empírico={np.quantile(u,p):.2f}")
print(f"Normal: cuantil teórico={qn:.2f}; empírico={np.quantile(v,p):.2f}")
print(f"En ambos modelos: {100*p:.1f}% queda a la izquierda y {100*(1-p):.1f}% a la derecha.")
fig,ax=plt.subplots(1,2,figsize=(10,4))
for eje,grid,F,q,titulo in [(ax[0],np.linspace(a-5,b+5,500),lambda x: np.clip((x-a)/(b-a),0,1),qu,"Uniforme"),(ax[1],np.linspace(mu-4*sigma,mu+4*sigma,500),lambda x: np.array([normal.cdf(float(t)) for t in x]),qn,"Normal")]:
    eje.plot(grid,F(grid));eje.axhline(p,color="C1",ls="--");eje.axvline(q,color="C1",ls="--")
    eje.scatter([q],[p],color="C1");eje.set(xlabel="Valor (unidades del modelo)",ylabel="Probabilidad acumulada",title=f"{titulo}: cuantil={q:.2f}")
fig.tight_layout()
print("Conclusión: la CDF pregunta cuánto queda por debajo de un valor; el cuantil hace la pregunta al revés: qué valor necesito para cubrir cierta proporción. El percentil 95 es un valor, no una probabilidad ni el máximo. El percentil 95 no significa “95% de probabilidad” por sí solo. Es un valor de la variable —77 o 124,67 en estos ejemplos— que deja 95% de los casos a su izquierda. Tampoco es el valor máximo: aún queda 5% de los resultados por encima.")`
  },
  {
    id: "vac-costo", title: "04 Clase 2 · Costo de esperar: centro y dispersión",
    description: "Slides 30–37. Reproduce C=500+200T con T uniforme entre 0 y 10. Cambia por separado el costo fijo y el costo por minuto; compara teoría y simulación.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
a,b,fijo,tarifa,n=0.0,10.0,500.0,200.0,10000
if not a<b or n<1: raise ValueError("Usa a<b y n>=1.")
t=rng.uniform(a,b,n);c=fijo+tarifa*t
media=(a+b)/2;var=(b-a)**2/12
print(f"E[T]={media:.2f} minutos; Var(T)={var:.2f} minutos²; SD(T)={np.sqrt(var):.2f} minutos")
print(f"E[C]={fijo+tarifa*media:.2f} pesos; media simulada={c.mean():.2f}")
print(f"Var(C)={tarifa**2*var:.2f} pesos²; SD(C)={abs(tarifa)*np.sqrt(var):.2f} pesos")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].hist(t,bins=30,density=True);ax[0].axvline(media,color="C1",label="Media teórica")
ax[0].set(xlabel="Espera (minutos)",ylabel="Densidad",title="Tiempo de espera");ax[0].legend()
ax[1].hist(c,bins=30,density=True);ax[1].axvline(fijo+tarifa*media,color="C1",label="Media teórica")
ax[1].set(xlabel="Costo (pesos)",ylabel="Densidad",title="La misma incertidumbre en otra escala");ax[1].legend()
fig.tight_layout()
print("Conclusión: subir el costo fijo mueve todos los costos por igual, sin separarlos más entre sí. Duplicar la tarifa duplica las distancias a la media: la desviación estándar se duplica y la varianza se cuadruplica. La esperanza es el centro, no el costo que cada persona pagará.")`
  },
  {
    id: "vac-nolineal", title: "05 Clase 2 · El costo del promedio no es el costo promedio de las esperas",
    description: "Slides 31–32. Extensión aplicada: una penalización cuadrática por demora. Mantén la misma espera media y aumenta su dispersión para ver por qué E[T²] no es E[T]².",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
centro,semiancho,k,n=5.0,4.0,100.0,10000  # Costo=k*T²
if not 0<semiancho<=centro or k<=0 or n<1: raise ValueError("Usa 0<semiancho<=centro, k>0, n>=1.")
t=rng.uniform(centro-semiancho,centro+semiancho,n)
var=semiancho**2/3
print(f"Costo en la espera media: k*E[T]²={k*centro**2:.2f}")
print(f"Costo medio: E[k*T²]={k*(centro**2+var):.2f}; simulado={np.mean(k*t**2):.2f}")
print(f"Diferencia=k*Var(T)={k*var:.2f}")
grid=np.linspace(centro-semiancho,centro+semiancho,300)
fig,ax=plt.subplots(figsize=(8,4))
ax.plot(grid,k*grid**2,label="Costo de cada demora")
ax.axhline(k*centro**2,color="C1",ls="--",label="Costo en la demora media")
ax.axhline(k*(centro**2+var),color="C2",ls="--",label="Costo promedio")
ax.set(xlabel="Demora",ylabel="Costo (unidades hipotéticas)",title="La curvatura hace que la variabilidad importe")
ax.legend();fig.tight_layout()
print("Conclusión: con un costo que crece cada vez más rápido, una demora grande perjudica más de lo que una demora pequeña ayuda. Por eso dos servicios con la misma espera media pueden tener distinto costo promedio: el más irregular cuesta más en este modelo.")`
  },
  {
    id: "vac-normal", title: "06 Clase 2 · Normal: áreas y distancias a la media",
    description: "Slides 38–46. Puntajes hipotéticos N(100,15²). Cambia mu, sigma y el intervalo; compara el área original con la estandarizada. NumPy recibe sigma (desviación), no sigma².",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
from statistics import NormalDist
rng=np.random.default_rng(123)
mu,sigma,a,b,n=100.0,15.0,85.0,115.0,10000
if sigma<=0 or not a<b or n<1: raise ValueError("Usa sigma>0, a<b, n>=1.")
dist=NormalDist(mu,sigma);normal=NormalDist()
x=rng.normal(mu,sigma,n);za,zb=(a-mu)/sigma,(b-mu)/sigma
prob=dist.cdf(b)-dist.cdf(a)
print(f"Intervalo original [{a},{b}] -> intervalo Z [{za:.2f},{zb:.2f}]")
print(f"Probabilidad={prob:.4f}; frecuencia simulada={np.mean((x>=a)&(x<=b)):.4f}")
for j in [1,2,3]: print(f"Dentro de {j} desviaciones: {100*(normal.cdf(j)-normal.cdf(-j)):.2f}%")
fig,ax=plt.subplots(1,2,figsize=(10,4))
for eje,m,s,l,h,titulo in [(ax[0],mu,sigma,a,b,"Escala original"),(ax[1],0,1,za,zb,"Escala estandarizada")]:
    grid=np.linspace(min(m-4*s,l),max(m+4*s,h),1000)
    f=np.exp(-.5*((grid-m)/s)**2)/(s*np.sqrt(2*np.pi))
    eje.plot(grid,f);eje.fill_between(grid,0,f,where=(grid>=l)&(grid<=h),alpha=.35)
    eje.set(xlabel="Puntaje" if titulo=="Escala original" else "Desviaciones desde la media",ylabel="Densidad",title=f"{titulo}: área={prob:.3f}")
fig.tight_layout()
print("Conclusión: restar la media y dividir por la desviación cambia la regla con que medimos, no quién está dentro del intervalo. Mu mueve la campana; sigma la ensancha. La regla 68-95-99.7 corresponde a una normal, no a cualquier conjunto de datos.")`
  },
  {
    id: "vac-estandarizar", title: "07 Clase 2 · Estandarizar no vuelve normales los datos",
    description: "Slide 41. Contraste con una espera exponencial, claramente asimétrica. Cambia su media: centrar y escalar no elimina su cola derecha.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
media,n=5.0,10000
if media<=0 or n<2: raise ValueError("Usa media>0 y n>=2.")
x=rng.exponential(media,n)
z=(x-media)/media  # En una exponencial la desviación poblacional también es media
print(f"Media de Z simulada={z.mean():.3f}; varianza={z.var():.3f}; teoría: 0 y 1")
print("Z no puede ser menor que -1, mientras una normal estándar sí puede.")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].hist(x,bins=60,density=True);ax[0].set(xlabel="Espera",ylabel="Densidad",title="Datos originales: asimétricos")
ax[1].hist(z,bins=60,density=True,label="Datos estandarizados")
grid=np.linspace(-4,max(4,np.quantile(z,.995)),500)
ax[1].plot(grid,np.exp(-grid**2/2)/np.sqrt(2*np.pi),label="Normal estándar")
ax[1].set(xlabel="(X-media)/desviación",ylabel="Densidad",title="Centro 0 y varianza 1 no bastan");ax[1].legend()
fig.tight_layout()
print("Conclusión: estandarizar es cambiar de unidades. La cola larga sigue ahí: no transformamos una distribución asimétrica en una campana. Tener media cero y varianza uno no identifica una distribución normal.")`
  },
  {
    id: "vac-covarianza", title: "08 Clase 2 · Riesgo conjunto: importa moverse juntos",
    description: "Slide 33. Dos errores de demanda de varianza uno. Cambia rho entre -1 y 1 y observa la dispersión de su suma. La independencia es suficiente para sumar varianzas, pero no necesaria: basta covarianza cero.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
rho,n=.8,10000
if not -1<=rho<=1 or n<2: raise ValueError("Usa -1<=rho<=1 y n>=2.")
x=rng.normal(size=n);z=rng.normal(size=n)
y=rho*x+np.sqrt(1-rho**2)*z
s=x+y
print(f"Var(X)=Var(Y)=1; Cov(X,Y)=rho={rho:.2f}")
print(f"Var(X+Y)=2+2*rho={2+2*rho:.3f}; simulada={s.var():.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].scatter(x[:1000],y[:1000],s=8,alpha=.25)
ax[0].set(xlabel="Error de demanda A",ylabel="Error de demanda B",title=f"¿Se mueven juntos? rho={rho}")
ax[1].hist(s,bins=45,density=True,alpha=.6,label="Suma con rho elegido")
ax[1].hist(x+z,bins=45,density=True,histtype="step",label="Suma independiente")
ax[1].set(xlabel="Error total",ylabel="Densidad",title="La covarianza cambia el riesgo total");ax[1].legend()
fig.tight_layout()
print("Conclusión: si ambos errores suelen ser altos a la vez, se refuerzan y la suma es más incierta. Si uno suele compensar al otro, la suma se estabiliza. Ignorar esa relación puede subestimar o sobrestimar el riesgo conjunto.")`
  },
  {
    id: "vac-lgn", title: "09 Clase 2 · LGN: el promedio se estabiliza",
    description: "Slides 48–51. Encuestas independientes con ingresos exponenciales hipotéticos. Cambia los tamaños y epsilon (tolerancia en millones). B es el número de encuestas repetidas, no el tamaño de cada encuesta.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
media,B,epsilon=1.5,1000,.15  # Ingresos en millones; E[X]=SD(X)=media
tamanos=[10,30,100,500,1500]
if media<=0 or epsilon<=0 or B<2 or not tamanos or min(tamanos)<2 or B*max(tamanos)>5000000:
    raise ValueError("Usa media,epsilon>0, B>=2, tamaños>=2 y B*max(tamaños)<=5 millones.")
tray=rng.exponential(media,max(tamanos));pasos=np.arange(1,len(tray)+1)
errores=[]
for n in tamanos:
    promedios=rng.exponential(media,size=(B,n)).mean(axis=1)
    prob=np.mean(abs(promedios-media)>epsilon);errores.append(prob)
    print(f"n={n}: SD medias={promedios.std(ddof=1):.4f}, teoría={media/np.sqrt(n):.4f}; P(error>{epsilon})≈{prob:.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].plot(pasos,tray.cumsum()/pasos);ax[0].axhline(media,color="C1",ls="--")
ax[0].axhspan(media-epsilon,media+epsilon,alpha=.15,color="C1")
ax[0].set(xlabel="Personas acumuladas",ylabel="Ingreso promedio (millones)",title="Una encuesta que va creciendo")
ax[1].plot(tamanos,errores,"o-");ax[1].set(xlabel="Personas por encuesta",ylabel="Fracción de encuestas con error grande",ylim=(0,1),title="Muchas encuestas posibles")
fig.tight_layout()
print("Conclusión: al promediar más observaciones independientes, los valores altos y bajos tienden a compensarse. Es menos probable equivocarse mucho, aunque una nueva observación puede alejar temporalmente el promedio de la verdad. Más B hace más estable la simulación; más n hace más precisa cada encuesta.")`
  },
  {
    id: "vac-tcl", title: "10 Clase 2 · TCL: la campana aparece en los promedios",
    description: "Slides 38 y 52–54. Los ingresos individuales siguen siendo asimétricos. Compara la distribución original con el error estandarizado de las medias de muchas encuestas. No confundas n con B.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
media,B=1.5,3000
tamanos=[1,5,30,200]
if media<=0 or B<2 or not tamanos or min(tamanos)<1 or B*max(tamanos)>5000000:
    raise ValueError("Usa media>0, B>=2, tamaños>=1 y B*max(tamaños)<=5 millones.")
fig,ax=plt.subplots(1,2,figsize=(10,4))
datos=rng.exponential(media,20000)
ax[0].hist(datos,bins=65,density=True)
ax[0].set(xlabel="Ingreso individual (millones)",ylabel="Densidad",title="Los individuos no se vuelven normales")
for n in tamanos:
    promedios=rng.exponential(media,size=(B,n)).mean(axis=1)
    z=np.sqrt(n)*(promedios-media)/media
    ax[1].hist(z,bins=70,density=True,histtype="step",label=f"n={n}")
    print(f"n={n}: media Z={z.mean():.3f}, SD Z={z.std(ddof=1):.3f}; SD promedio teórica={media/np.sqrt(n):.3f}")
grid=np.linspace(-4,4,500)
ax[1].plot(grid,np.exp(-grid**2/2)/np.sqrt(2*np.pi),color="black",ls="--",label="N(0,1)")
ax[1].set(xlim=(-4,4),xlabel="(Promedio-media)/(sigma/raíz(n))",ylabel="Densidad",title="Errores de los promedios (vista central)")
ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: las personas pueden tener ingresos muy asimétricos, pero el promedio de muchas personas independientes tiene errores con forma cada vez más parecida a una campana. La LGN dice que el error se achica; el TCL describe su forma después de ponerlo en una escala comparable. Aquí hay independencia y varianza finita.")`
  },
  {
    id: "vac-regresion", title: "11 Clase 2 · Regresión: una recta resume una curva",
    description: "Slides 55–60 y 63. Datos hipotéticos de educación e ingreso. Cambia la curvatura y el ruido. Observa la media condicional verdadera, la recta MCO y los residuos: asociación no significa causalidad.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n,curvatura,ruido=500,.015,.25
if n<3 or ruido<0: raise ValueError("Usa n>=3 y ruido>=0.")
x=rng.uniform(8,20,n)
m=lambda t: .6+.08*(t-8)+curvatura*(t-14)**2
y=m(x)+rng.normal(0,ruido,n)
X=np.column_stack([np.ones(n),x]);beta=np.linalg.lstsq(X,y,rcond=None)[0]
residuo=y-X@beta
print(f"Recta estimada: ingreso={beta[0]:.3f}+{beta[1]:.3f}*educación")
print(f"Media residuos={residuo.mean():.2e}; media X*residuo={np.mean(x*residuo):.2e}")
print("Estas igualdades de MCO no garantizan que el residuo tenga media cero en cada nivel de educación.")
grid=np.linspace(8,20,200)
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].scatter(x,y,s=9,alpha=.2);ax[0].plot(grid,m(grid),color="C2",label="Media condicional verdadera")
ax[0].plot(grid,beta[0]+beta[1]*grid,color="C1",label="Recta MCO")
ax[0].set(xlabel="Educación (años)",ylabel="Ingreso (millones)",title="Una recta puede perder curvatura");ax[0].legend(fontsize=8)
ax[1].scatter(x,residuo,s=9,alpha=.2);ax[1].axhline(0,color="C1")
ax[1].plot(grid,m(grid)-(beta[0]+beta[1]*grid),color="C2",label="Patrón medio respecto de la recta")
ax[1].set(xlabel="Educación (años)",ylabel="Residuo",title="Promedio global cero no es ausencia de patrón");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: MCO dibuja la mejor recta según errores cuadrados, pero la relación promedio puede ser curva. Residuos equilibrados en conjunto pueden esconder errores sistemáticos por grupos. Esta recta describe una asociación simulada: por sí sola no dice cuánto ganaría alguien si cambiara su educación.")`
  },
  {
    id: "vac-mco-muestras", title: "12 Clase 2 · MCO: más datos, menos incertidumbre",
    description: "Slides 61–62. Repite regresiones con X normal y ruido exponencial independiente de media cero. Cambia n y B. El panel derecho usa la desviación asintótica de este modelo, no una fórmula universal.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
beta1,sigma,B=2.0,1.0,1000
tamanos=[20,100,500]
if sigma<=0 or B<2 or not tamanos or min(tamanos)<3 or B*max(tamanos)>5000000:
    raise ValueError("Usa sigma>0, B>=2, tamaños>=3 y B*max(tamaños)<=5 millones.")
fig,ax=plt.subplots(1,2,figsize=(10,4))
for n in tamanos:
    x=rng.normal(size=(B,n));u=sigma*(rng.exponential(size=(B,n))-1)
    y=1+beta1*x+u
    xc=x-x.mean(axis=1,keepdims=True)
    b=(xc*y).sum(axis=1)/(xc**2).sum(axis=1)
    z=np.sqrt(n)*(b-beta1)/sigma  # Var(X)=1; u independiente, Var(u)=sigma²
    ax[0].hist(b,bins=45,density=True,histtype="step",label=f"n={n}")
    ax[1].hist(z,bins=45,density=True,histtype="step",label=f"n={n}")
    print(f"n={n}: media pendiente={b.mean():.3f}; SD={b.std(ddof=1):.3f}; aprox. sigma/raíz(n)={sigma/np.sqrt(n):.3f}")
ax[0].axvline(beta1,color="black",ls="--");ax[0].set(xlabel="Pendiente estimada",ylabel="Densidad",title="La estimación se concentra")
grid=np.linspace(-4,4,500);ax[1].plot(grid,np.exp(-grid**2/2)/np.sqrt(2*np.pi),color="black",ls="--",label="N(0,1)")
ax[1].set(xlim=(-4,4),xlabel="raíz(n)*(beta estimado-beta verdadero)/sigma",ylabel="Densidad",title="El error reescalado se parece a una normal")
for eje in ax: eje.legend(fontsize=8)
fig.tight_layout()
print("Conclusión: distintas muestras producen distintas rectas. Con más datos, la pendiente suele quedar más cerca del valor verdadero y su incertidumbre baja; no tiene que acertar exactamente en cada muestra. Esto funciona bajo los supuestos de esta simulación: más datos por sí solos no corrigen confusión ni garantizan causalidad.")`
  }
];
VAC_LABS.forEach(example => ECON_PYTHON_EXAMPLES.push({
  ...example, course: "econometria-aplicada-1", filename: example.title
}));
