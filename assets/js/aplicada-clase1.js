// Clase 1: variables aleatorias discretas. Ejercicios independientes.
for (let i = ECON_PYTHON_EXAMPLES.length - 1; i >= 0; i--) {
  if (ECON_PYTHON_EXAMPLES[i].course === "econometria-aplicada-1") ECON_PYTHON_EXAMPLES.splice(i, 1);
}
const VAD_LABS = [
  {
    id: "vad-bernoulli", title: "01 · Bernoulli: solicitudes de empleo",
    description: "Páginas 56–58. X=1 si una solicitud obtiene una oferta y X=0 si no. Cambia p y n; son datos simulados con probabilidad constante e independencia entre solicitudes.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng = np.random.default_rng(123) # Crea número aleatorio
p, n = 0.3, 1000  # Usted puede modificar: probabilidad de oferta y número de solicitudes
if not 0 <= p <= 1 or n < 1: raise ValueError("Usa 0<=p<=1 y n>=1.")
x = rng.binomial(1, p, size=n)
teoria = np.array([1-p, p])
observada = np.bincount(x.astype(np.intp), minlength=2)/n   # Cuenta cuántos ceros y unos aparecieron realmente en la simulación, y divide por n para obtener frecuencias relativas.
print("Primeros 30 resultados:", x[:30])
print("Probabilidades teóricas [0,1]:", teoria)
print("Frecuencias relativas [0,1]:", observada)
print(f"E[X]=p={p:.3f}; media simulada={x.mean():.3f}")
print(f"Var(X)=p(1-p)={p*(1-p):.3f}; varianza empírica={x.var():.3f}")
fig,ax=plt.subplots(figsize=(8,4))
ax.bar(np.arange(2)-.18,teoria,width=.36,label="Teoría")
ax.bar(np.arange(2)+.18,observada,width=.36,label="Simulación")
ax.set(xticks=[0,1],xticklabels=["Sin oferta (0)","Con oferta (1)"],
       ylabel="Probabilidad / frecuencia relativa",ylim=(0,1),title="PMF Bernoulli")
ax.legend();fig.tight_layout()
print("Intuición: La intuición central es que cada observación individual es incierta —una persona recibe o no recibe oferta—, pero cuando acumulamos muchas solicitudes, la proporción de ofertas suele acercarse a la probabilidad verdadera \(p\).")`
  },
  {
    id: "vad-cdf", title: "02 · Bernoulli: PMF y CDF",
    description: "Páginas 48–58. Cambia p y el umbral t. Compara P(X=t) con P(X≤t); la acumulada incluye la masa situada exactamente en t.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
p, t = 0.6, 0.0  # CAMBIA: prueba t=-0.1, 0, 0.5, 1
if not 0<=p<=1: raise ValueError("p debe estar entre 0 y 1.")
F=lambda s: np.where(np.asarray(s)<0,0,np.where(np.asarray(s)<1,1-p,1))
masa = 1-p if t==0 else p if t==1 else 0
print(f"P(X={t})={masa:.3f}; P(X<={t})={float(F(t)):.3f}")
print(f"F(0)={1-p:.3f}; F(1)=1. El valor en un salto es el valor después del salto.")
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].bar([0,1],[1-p,p])
axes[0].set(xticks=[0,1],ylim=(-.05,1.05),xlabel="x",ylabel="P(X=x)",title="Masa (PMF)")
axes[1].step([-.5,0,1,1.5],[0,1-p,1,1],where="post")
axes[1].scatter([0,1],[0,1-p],facecolors="white",edgecolors="C0",zorder=3)
axes[1].scatter([0,1],[1-p,1],color="C0",zorder=4)
axes[1].set(xlim=(-.5,1.5),ylim=(-.05,1.05),xlabel="x",ylabel="P(X≤x)",title="Acumulada (CDF)")
fig.tight_layout()
print("Conclusión: la PMF pregunta qué probabilidad tiene cada resultado; la CDF pregunta cuánto hemos acumulado hasta un valor. Al pasar por 0 o 1, la acumulada salta porque incorpora de una vez la probabilidad de ese resultado.")`
  },
  {
    id: "vad-dados", title: "03 · Dos dados: eventos y probabilidades",
    description: "Páginas 6–20 y 36. Enumera los 36 resultados equiprobables de dos dados justos independientes. Cambia el umbral y el número de simulaciones.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n, umbral = 5000, 8  # CAMBIA
if n<1: raise ValueError("n debe ser positivo.")
caras=np.arange(1,7)
matriz=caras[:,None]+caras[None,:]
soporte=np.arange(2,13)
pmf=np.array([np.mean(matriz==s) for s in soporte])
sim=rng.integers(1,7,size=(n,2)).sum(axis=1)
frecuencia=np.array([np.mean(sim==s) for s in soporte])
print("Matriz de resultados X = dado 1 + dado 2:\n",matriz)
print("  x     P(X=x)   F(x)")
for s,q,f in zip(soporte,pmf,pmf.cumsum()): print(f"{s:3d}     {q:.4f}   {f:.4f}")
print(f"P(X>={umbral})={pmf[soporte>=umbral].sum():.4f}; simulada={np.mean(sim>=umbral):.4f}")
print(f"E[X]={soporte@pmf:.3f}; media simulada={sim.mean():.3f}")
fig,ax=plt.subplots(figsize=(8,4))
ax.bar(soporte-.18,pmf,width=.36,label="Teórica")
ax.bar(soporte+.18,frecuencia,width=.36,label="Simulada")
ax.set(xticks=soporte,xlabel="Suma",ylabel="Probabilidad",title="Las sumas no son equiprobables")
ax.legend();fig.tight_layout()
print("Conclusión: los 36 pares son equiprobables, pero una suma es más probable cuando más pares producen ese valor.")`
  },
  {
    id: "vad-transformacion", title: "04 · De un dado a Bernoulli",
    description: "Páginas 23–32. Construye Y=1{X≥umbral}. Cambia el umbral y las probabilidades del dado para ver cómo se suman las masas de los resultados transformados.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
valores=np.arange(1,7)
probs=np.array([1,1,1,1,1,1],dtype=float)/6  # CAMBIA; deben sumar 1
umbral=4
if probs.shape!=(6,) or np.any(probs<0) or not np.isclose(probs.sum(),1):
    raise ValueError("Necesitas seis probabilidades no negativas que sumen 1.")
y=(valores>=umbral).astype(int)
p=probs[y==1].sum()
print("X:",valores,"\nY=g(X):",y)
print(f"P(Y=1)={p:.4f}; P(Y=0)={1-p:.4f}")
print(f"E[Y]={p:.4f}; Var(Y)={p*(1-p):.4f}")
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].bar(valores,probs,color=np.where(y==1,"C1","C0"))
axes[0].set(xlabel="X: cara del dado",ylabel="Probabilidad",title="Distribución original")
axes[1].bar([0,1],[1-p,p],color=["C0","C1"])
axes[1].set(xticks=[0,1],xlabel="Y: supera el umbral",ylabel="Probabilidad",title="Distribución transformada")
fig.tight_layout()
print("Conclusión: al convertir caras del dado en sí o no, juntamos varios resultados en una sola categoría. La probabilidad de sí es la suma de las probabilidades de todas las caras que cumplen la condición; mover el umbral cambia cuáles entran.")`
  },
  {
    id: "vad-beneficio", title: "05 · Beneficio esperado de una venta",
    description: "Páginas 33–39 y 46–47. Aplicación simulada: se paga un costo fijo de contacto y se obtiene un margen si el cliente compra. Cambia probabilidad, margen y costo.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
p, margen, costo, n = 0.3, 100.0, 20.0, 5000  # Valores monetarios en unidades hipotéticas
if not 0<=p<=1 or n<1: raise ValueError("Usa 0<=p<=1 y n>=1.")
compra=rng.binomial(1,p,n)
beneficio=margen*compra-costo
esperanza=margen*p-costo
varianza=margen**2*p*(1-p)
print(f"E[beneficio]={esperanza:.2f}; media simulada={beneficio.mean():.2f}")
print(f"Var(beneficio)={varianza:.2f}; varianza empírica={beneficio.var():.2f}")
if margen>0: print(f"Probabilidad de equilibrio: costo/margen={costo/margen:.3f}")
ps=np.linspace(0,1,101)
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].bar(["Sin venta","Con venta"],[-costo,margen-costo])
axes[0].axhline(0,color="gray")
axes[0].set(ylabel="Beneficio por contacto",title="Resultados posibles")
axes[1].plot(ps,margen*ps-costo)
axes[1].scatter([p],[esperanza],color="C1")
axes[1].axhline(0,color="gray",ls="--")
axes[1].set(xlabel="Probabilidad de compra",ylabel="Beneficio esperado",title="E[a+bX]=a+bE[X]")
fig.tight_layout()
print("Conclusión: la esperanza pondera beneficios por probabilidades. Un valor esperado positivo no garantiza ganancia en cada contacto; el costo fijo no cambia la varianza.")`
  },
  {
    id: "vad-lei", title: "06 · Ingresos, media condicional y LEI",
    description: "Páginas 41–45. Reproduce el ejemplo del PDF: ingresos en millones de pesos, con y sin educación universitaria. Cambia la proporción de cada grupo. Datos hipotéticos, no CASEN.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
q, n = 0.4, 5000  # q=P(universitaria=1)
if not 0<=q<=1 or n<1: raise ValueError("Usa 0<=q<=1 y n>=1.")
ingresos0=np.array([1,2]); p0=np.array([.75,.25])
ingresos1=np.array([2,4]); p1=np.array([.5,.5])
m0,m1=ingresos0@p0,ingresos1@p1
soporte=np.array([1,2,4])
pmf=np.array([(1-q)*.75,(1-q)*.25+q*.5,q*.5])
directa=soporte@pmf
iterada=(1-q)*m0+q*m1
x=rng.binomial(1,q,n)
y=np.empty(n)
y[x==0]=rng.choice(ingresos0,size=np.sum(x==0),p=p0)
y[x==1]=rng.choice(ingresos1,size=np.sum(x==1),p=p1)
print(f"E[Y|X=0]={m0:.2f}; E[Y|X=1]={m1:.2f}")
print(f"E[Y] directa={directa:.2f}; por LEI={iterada:.2f}; muestra={y.mean():.2f}")
print("PMF ingreso [1,2,4]:",pmf)
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].bar(["Sin universidad","Con universidad"],[m0,m1])
axes[0].axhline(iterada,color="C1",ls="--",label="Media total")
axes[0].set(ylabel="Ingreso esperado (millones)",title="Medias condicionales");axes[0].legend()
axes[1].bar(soporte,pmf,width=.5)
axes[1].set(xticks=soporte,xlabel="Ingreso (millones)",ylabel="Probabilidad",title="Distribución en toda la población")
fig.tight_layout()
print("Conclusión: la media total es el promedio de las medias de grupo ponderado por sus proporciones. La diferencia entre grupos no demuestra un efecto causal de la educación.")`
  },
  {
    id: "vad-proporcion", title: "07 · Bernoulli: frecuencia y probabilidad",
    description: "Extensión práctica de E[X]=p: observa cómo cambia la proporción de ofertas al acumular solicitudes independientes. Cambia p y n; la convergencia no es monótona.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
p, n = 0.35, 2000
if not 0<=p<=1 or n<1: raise ValueError("Usa 0<=p<=1 y n>=1.")
x=rng.binomial(1,p,n)
pasos=np.arange(1,n+1)
proporcion=x.cumsum()/pasos
print(f"Probabilidad poblacional={p:.3f}; proporción final={proporcion[-1]:.3f}")
print(f"Error estándar teórico de la proporción final={np.sqrt(p*(1-p)/n):.4f}")
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].plot(pasos,proporcion,label="Proporción acumulada")
axes[0].axhline(p,color="C1",ls="--",label="p verdadero")
axes[0].set(xlabel="Solicitudes acumuladas",ylabel="Proporción",ylim=(0,1),title="De frecuencia a probabilidad")
axes[0].legend()
ps=np.linspace(0,1,101)
axes[1].plot(ps,ps*(1-ps));axes[1].scatter([p],[p*(1-p)],color="C1")
axes[1].set(xlabel="p",ylabel="Var(X)",title="Varianza Bernoulli: máxima en p=0.5")
fig.tight_layout()
print("Conclusión: bajo independencia y p constante, la proporción converge a p al crecer la muestra, aunque puede alejarse temporalmente. La varianza de cada X es p(1-p); la de su promedio es p(1-p)/n.")`
  },
  {
    id: "vad-binomial", title: "08 · De Bernoulli al número de ofertas",
    description: "Extensión: cada solicitud es Bernoulli; la suma de m solicitudes independientes con la misma p es binomial. Cambia m, p y el umbral de ofertas.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
from math import comb
rng=np.random.default_rng(123)
p, m, B, umbral = 0.3, 10, 5000, 3
if not 0<=p<=1 or not 1<=m<=100 or B<1:
    raise ValueError("Usa 0<=p<=1, 1<=m<=100 y B>=1.")
ofertas=rng.binomial(1,p,size=(B,m)).sum(axis=1)
k=np.arange(m+1)
pmf=np.array([comb(m,int(j))*p**j*(1-p)**(m-j) for j in k])
frecuencia=np.bincount(ofertas.astype(np.intp),minlength=m+1)/B
print(f"E[ofertas]=m*p={m*p:.3f}; media simulada={ofertas.mean():.3f}")
print(f"Var(ofertas)=m*p*(1-p)={m*p*(1-p):.3f}")
print(f"P(ofertas>={umbral})={pmf[k>=umbral].sum():.4f}")
print(f"P(al menos una oferta)=1-(1-p)^m={1-(1-p)**m:.4f}")
fig,ax=plt.subplots(figsize=(8,4))
ax.bar(k-.18,pmf,width=.36,label="Binomial teórica")
ax.bar(k+.18,frecuencia,width=.36,label="Suma de Bernoulli simuladas")
ax.set(xlabel="Número de ofertas",ylabel="Probabilidad",title="Una solicitud: Bernoulli; suma: binomial")
ax.legend();fig.tight_layout()
print("Conclusión: la suma cuenta éxitos y toma valores de 0 a m. La fórmula binomial requiere solicitudes independientes y una misma probabilidad p.")`
  }
];
VAD_LABS.forEach(example => {
  const title = example.title.replace(" · ", " Clase 1 · ").replace("solicitudes de empleo", "Solicitudes de empleo");
  ECON_PYTHON_EXAMPLES.push({ ...example, title, course: "econometria-aplicada-1", filename: title });
});
