// Ampliación de Clase 4, PDF de 127 páginas. Los códigos 01–22 se conservan.
const A4V_IMPORTS=String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
np.set_printoptions(precision=4,suppress=True)
`;
const A4V_LABS=[
{
id:"a4v-abanico",title:"23 Clase 4 · Homocedasticidad y heteroscedasticidad: ver el abanico",
description:"Slides 94 y 102–104. Compara la misma media condicional con dispersión constante o cambiante. Cambia intensidad a 0, 1 o 2. Datos ficticios, no datos de CPS.",
code:A4V_IMPORTS+String.raw`n,beta0,beta1,sigma,intensidad=500,2.0,1.0,2.0,1.0
if not isinstance(n,int) or not 30<=n<=10000 or sigma<=0 or not 0<=intensidad<=2:
    raise ValueError("Usa n entero entre 30 y 10000, sigma>0 e intensidad entre 0 y 2.")
x=np.linspace(1,10,n);xc=x-x.mean();Sxx=xc@xc
media=beta0+beta1*x;z=rng.normal(size=n)
perfil=x**intensidad
sd_hetero=sigma*perfil/np.sqrt(np.mean(perfil**2))
# Igualamos la varianza promedio del error para comparar su distribución sobre x.
escalas=[np.full(n,sigma),sd_hetero]
fig,ax=plt.subplots(2,2,figsize=(10,7),sharex=True,sharey="row")
pendientes=[]
for j,(nombre,sd) in enumerate(zip(["Homocedasticidad","Heteroscedasticidad"],escalas)):
    y=media+sd*z
    b1=xc@y/Sxx;b0=y.mean()-b1*x.mean();res=y-b0-b1*x;pendientes.append(b1)
    print(f"{nombre}: beta1_hat={b1:.4f}; Var(u|x) promedio={np.mean(sd**2):.3f}")
    print(f"SD del error en extremos x={x[0]:g} y {x[-1]:g}: {sd[0]:.3f}, {sd[-1]:.3f}")
    ax[0,j].scatter(x,y,s=9,alpha=.3,label="Datos simulados")
    ax[0,j].plot(x,media,color="black",label="Misma media verdadera")
    ax[0,j].plot(x,b0+b1*x,color="C1",label="MCO")
    ax[0,j].fill_between(x,media-2*sd,media+2*sd,alpha=.12,label="Media ± 2 SD del error")
    ax[0,j].set(title=nombre,ylabel="y");ax[0,j].legend(fontsize=7)
    ax[1,j].scatter(x,res,s=9,alpha=.3);ax[1,j].axhline(0,color="black",ls="--")
    ax[1,j].set(xlabel="x",ylabel="Residuo MCO",title="¿El ancho de la nube cambia con x?")
    for bloque in np.array_split(np.arange(n),5):
        print(f"  x medio={x[bloque].mean():.1f}: media residuo={res[bloque].mean():.3f}; SD residuo={res[bloque].std(ddof=1):.3f}")
print("La banda describe dispersión de individuos, NO un intervalo de confianza para la recta.")
print("Fijamos x y reutilizamos los mismos shocks z en ambos escenarios para compararlos.")
fig.tight_layout()
print("Conclusión: homocedasticidad significa un ancho similar de la nube alrededor de la media para todo x. Heteroscedasticidad significa que ese ancho cambia: no exige que cambie la pendiente ni que el error tenga media distinta de cero. Con intensidad=0 las dos simulaciones coinciden. Un abanico orienta el diagnóstico, pero un gráfico aislado no demuestra ni descarta el supuesto.")`
},
{
id:"a4v-insesgadez",title:"24 Clase 4 · Heteroscedasticidad no es lo mismo que sesgo",
description:"Slides 66–68, 88–94 y 105. Repite muestras de errores con x fija. Compara dispersión cambiante con un error cuya media depende de x. Cambia delta a 0 para eliminar esa última fuente de sesgo.",
code:A4V_IMPORTS+String.raw`n,B,beta,sigma,intensidad,delta=200,2000,2.0,2.0,1.0,.6
if not isinstance(n,int) or not isinstance(B,int) or n<20 or B<100 or n*B>2000000:
    raise ValueError("Usa enteros n>=20, B>=100 y n*B<=2 millones.")
if sigma<=0 or not 0<=intensidad<=2 or not np.isfinite(delta): raise ValueError("Revisa sigma, intensidad y delta.")
x=np.linspace(1,10,n);xc=x-x.mean();Sxx=xc@xc
perfil=x**intensidad;sd=sigma*perfil/np.sqrt(np.mean(perfil**2))
z=rng.normal(size=(B,n));errores=[sigma*z,sd*z,delta*xc+sd*z]
nombres=["Homo: E(u|x)=0","Hetero: E(u|x)=0","Hetero: E(u|x)=delta*(x-xbar)"]
centros=np.array([beta,beta,beta+delta]);estimaciones=[];sd_teoricas=[]
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
for j,(nombre,u,centro) in enumerate(zip(nombres,errores,centros)):
    y=1+beta*x+u;b=(y@xc)/Sxx;estimaciones.append(b)
    escala=np.full(n,sigma) if j==0 else sd
    sd_real=np.sqrt(np.sum(xc**2*escala**2))/Sxx;sd_teoricas.append(sd_real)
    print(f"{nombre}: media beta_hat={b.mean():.4f}; centro teórico={centro:.4f}; SD={b.std(ddof=1):.4f}; SD teórica={sd_real:.4f}")
    print(f"  Error Monte Carlo de la media ≈ {b.std(ddof=1)/np.sqrt(B):.4f}")
    ax[0].hist(b,bins=40,density=True,histtype="step",label=nombre)
ax[0].axvline(beta,color="black",ls="--",label="Beta estructural")
ax[0].set(xlabel="Pendiente estimada",ylabel="Densidad",title="Repetir el muestreo revela el centro");ax[0].legend(fontsize=7)
ax[1].plot(x,np.zeros(n),label="Media cero (homo y hetero)")
ax[1].plot(x,delta*xc,label="Media no cero (tercer caso)")
ax[1].set(xlabel="x",ylabel="E(u|x)",title="La media del error es otra pregunta");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: cambiar la dispersión del error no desplaza por sí solo el centro de MCO cuando E(u|x)=0. Cuando delta es distinto de cero, el tercer caso mezcla la pendiente con delta porque cambia la media del error. Aumentar n concentra las estimaciones, pero no elimina ese sesgo; aumentar B solo mejora la simulación. Los errores estándar robustos cambian la incertidumbre reportada, no corrigen endogeneidad ni garantizan causalidad.")`
},
{
id:"a4v-robustos",title:"25 Clase 4 · Errores estándar clásicos y robustos: qué cambia",
description:"Slides 105–109. Traduce la simulación de las slides: x=1,...,500; y=x+u; SD(u|x)=0.6*x. Calcula HC0 paso a paso y HC1; repite muestras para comparar cobertura y falsos rechazos.",
code:A4V_IMPORTS+String.raw`from scipy.stats import norm
n,B,beta,escala,alfa=500,2000,1.0,.6,.05
hetero=True  # False: varianza constante con la misma varianza promedio
if not isinstance(n,int) or not isinstance(B,int) or n<30 or B<100 or n*B>2000000:
    raise ValueError("Usa enteros n>=30, B>=100 y n*B<=2 millones.")
if escala<=0 or not 0<alfa<1: raise ValueError("Usa escala>0 y 0<alfa<1.")
x=np.arange(1,n+1,dtype=float);xc=x-x.mean();Sxx=xc@xc
sd=escala*x if hetero else np.full(n,escala*np.sqrt(np.mean(x**2)))
y=beta*x+rng.normal(size=(B,n))*sd
# Estimamos intercepto y pendiente, aunque el intercepto verdadero es cero.
b=(y@xc)/Sxx;b0=y.mean(axis=1)-b*x.mean();res=y-b0[:,None]-b[:,None]*x
se_clasico=np.sqrt(np.sum(res**2,axis=1)/(n-2)/Sxx)
se_hc0=np.sqrt(np.sum(xc**2*res**2,axis=1))/Sxx  # Fórmula de la slide 106
se_hc1=se_hc0*np.sqrt(n/(n-2))  # Corrección por dos parámetros estimados
se_real=np.sqrt(np.sum(xc**2*sd**2))/Sxx  # Solo se conoce en la simulación
crit=norm.ppf(1-alfa/2)
print(f"Primera muestra: beta0_hat={b0[0]:.4f}, beta1_hat={b[0]:.4f}; beta verdadero={beta}")
print(f"HC0: numerador sum((x-xbar)^2*res^2)={np.sum(xc**2*res[0]**2):.3f}; Sxx={Sxx:.3f}")
print(f"SD real condicional de beta_hat={se_real:.5f}; SD entre {B} muestras={b.std(ddof=1):.5f}")
metodos={"Clásico":se_clasico,"Robusto HC0":se_hc0,"Robusto HC1":se_hc1}
coberturas=[];rechazos=[]
fig,ax=plt.subplots(2,2,figsize=(11,8))
ax[0,0].scatter(x,y[0],s=9,alpha=.3);ax[0,0].plot(x,b0[0]+b[0]*x,color="C1",label="MCO")
ax[0,0].plot(x,beta*x,"--",color="black",label="Media verdadera")
ax[0,0].set(xlabel="x",ylabel="y",title="Primera muestra (no elegida por su p-valor)");ax[0,0].legend(fontsize=8)
for j,(nombre,se) in enumerate(metodos.items()):
    t=(b-beta)/se;p=2*norm.sf(abs(t));rechazo=np.mean(p<alfa);cobertura=np.mean(abs(b-beta)<=crit*se)
    rechazos.append(rechazo);coberturas.append(cobertura)
    print(f"{nombre}: SE primera muestra={se[0]:.5f}; t={t[0]:.3f}; p normal={p[0]:.4f}; IC=[{b[0]-crit*se[0]:.4f},{b[0]+crit*se[0]:.4f}]")
    print(f"  SE promedio={se.mean():.5f}; cobertura={cobertura:.3f}; falso rechazo={rechazo:.3f}; error Monte Carlo≈{np.sqrt(rechazo*(1-rechazo)/B):.3f}")
    ax[0,1].errorbar(b[0],j,xerr=crit*se[0],fmt="o",capsize=5)
ax[0,1].axvline(beta,color="black",ls="--");ax[0,1].set(yticks=range(3),yticklabels=list(metodos),xlabel="Pendiente e intervalo",title="Misma pendiente, distinta incertidumbre")
ax[1,0].bar(list(metodos),[se.mean() for se in metodos.values()]);ax[1,0].axhline(se_real,color="black",ls="--",label="SD verdadera")
ax[1,0].set(ylabel="Error estándar promedio",title="¿Qué fórmula se acerca a la dispersión real?");ax[1,0].legend(fontsize=8)
ax[1,1].bar(list(metodos),rechazos);ax[1,1].axhline(alfa,color="black",ls="--",label="Nivel alfa")
ax[1,1].set(ylabel="Fracción de falsos rechazos",ylim=(0,max(.12,max(rechazos)*1.3)),title="H0: beta=valor verdadero");ax[1,1].legend(fontsize=8)
fig.tight_layout()
print("Usamos referencia normal para los tres métodos: comparación asintótica, NO una t exacta con SE robustos.")
print("Aquí x es fija: los errores son independientes, pero con hetero=True no idénticamente distribuidos. La semilla de NumPy no reproduce los mismos datos que la semilla de R.")
print("Conclusión: robusto no vuelve a ajustar la recta: cambia cómo medimos su incertidumbre. Con dispersión creciente, la fórmula clásica puede dar una confianza equivocada; HC0/HC1 incorporan cuánto pesa cada residuo según x. Su validez es asintótica: una muestra concreta puede rechazar una H0 verdadera con cualquiera de los métodos, y los SE robustos no son siempre mayores. No corrigen sesgo por variables omitidas ni dependencia entre observaciones; para esta última se necesitan otros métodos.")`
},
{
id:"a4v-grados",title:"26 Clase 4 · Por qué estimamos la varianza con n menos 2",
description:"Slides 96–101. Compara dividir la suma de residuos cuadrados por n o por n−2. Cambia n: con muestras pequeñas se nota más que estimar la recta consume dos grados de libertad.",
code:A4V_IMPORTS+String.raw`n,B,sigma=10,5000,2.0
if not isinstance(n,int) or not isinstance(B,int) or n<3 or B<100 or n*B>2000000 or sigma<=0:
    raise ValueError("Usa enteros n>=3, B>=100, n*B<=2 millones y sigma>0.")
x=np.linspace(-2,2,n);xc=x-x.mean();Sxx=xc@xc
u=rng.normal(0,sigma,(B,n));y=1+2*x+u
b=(y@xc)/Sxx;b0=y.mean(axis=1)-b*x.mean();res=y-b0[:,None]-b[:,None]*x
scr=np.sum(res**2,axis=1);con_n=scr/n;con_gl=scr/(n-2)
print(f"Varianza verdadera sigma²={sigma**2:.3f}; parámetros estimados=2; grados libres={n-2}")
print(f"Dividir por n: media={con_n.mean():.4f}; esperanza teórica={(n-2)/n*sigma**2:.4f}")
print(f"Dividir por n-2: media={con_gl.mean():.4f}; esperanza teórica={sigma**2:.4f}")
print(f"Si conociéramos los errores verdaderos: promedio sum(u²)/n={np.mean(u**2):.4f}")
print(f"Primer ajuste: suma residuos={res[0].sum():.2e}; suma x*residuos={x@res[0]:.2e}")
print(f"SER promedio={np.sqrt(con_gl).mean():.4f}; sigma={sigma:.4f}. La raíz de un estimador insesgado no tiene que ser insesgada.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
for valores,nombre in [(con_n,"SCR/n"),(con_gl,"SCR/(n-2)")]: ax[0].hist(valores,bins=50,density=True,histtype="step",label=nombre)
ax[0].axvline(sigma**2,color="black",ls="--",label="Varianza verdadera");ax[0].set(xlabel="Varianza estimada",ylabel="Densidad",title="Ajustar reduce los residuos dentro de muestra");ax[0].legend(fontsize=8)
ns=np.arange(3,max(101,n+1));ax[1].plot(ns,1-2/ns,label="E[SCR/n] / sigma²");ax[1].axhline(1,color="C1",ls="--",label="E[SCR/(n-2)] / sigma²")
ax[1].scatter([n],[(n-2)/n],color="black");ax[1].set(xlabel="n",ylabel="Varianza media / verdadera",title="La pérdida relativa pesa más con pocos datos");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: la recta se adapta a los mismos datos con que medimos sus errores, por lo que los residuos parecen demasiado pequeños. Estimar intercepto y pendiente impone dos restricciones; dividir por n-2 compensa ese ajuste en promedio bajo homocedasticidad y exogeneidad. No significa borrar dos filas. Con heteroscedasticidad no existe una única varianza condicional constante que esta corrección recupere.")`
},
{
id:"a4v-intercepto",title:"27 Clase 4 · Precisión del intercepto y la pendiente",
description:"Slides 27, 95 y 98–101. Educación entre 8 y 18 años: estima la recta y compara incertidumbre al predecir en x=0 o en el centro. Centrar x cambia la interpretación del intercepto, no la pendiente ni las predicciones.",
code:A4V_IMPORTS+String.raw`n,B,beta0,beta1,sigma=80,2000,280.0,62.0,180.0
x_min,x_max=8.0,18.0
if not isinstance(n,int) or not isinstance(B,int) or n<3 or B<100 or n*B>2000000 or sigma<=0 or not x_min<x_max:
    raise ValueError("Usa enteros n>=3, B>=100, n*B<=2 millones, sigma>0 y x_min<x_max.")
x=np.linspace(x_min,x_max,n);xc=x-x.mean();Sxx=xc@xc
y=beta0+beta1*x+rng.normal(0,sigma,(B,n))
b=(y@xc)/Sxx;b0=y.mean(axis=1)-b*x.mean();centro=y.mean(axis=1)
res=y-b0[:,None]-b[:,None]*x;s2=np.sum(res**2,axis=1)/(n-2)
var_b1=sigma**2/Sxx
var_b0=sigma**2*(1/n+x.mean()**2/Sxx)
var_centro=sigma**2/n
print("Var(beta0_hat|X) = sigma² * (1/n + xbar²/Sxx) = sigma² * sum(x²)/(n*Sxx)")
print("El factor n del denominador es necesario, como en la slide 95.")
for nombre,estimado,verdad,varianza in [("Intercepto original",b0,beta0,var_b0),("Pendiente",b,beta1,var_b1),("Intercepto con x centrada",centro,beta0+beta1*x.mean(),var_centro)]:
    print(f"{nombre}: verdad={verdad:.3f}; media={estimado.mean():.3f}; SD simulada={estimado.std(ddof=1):.3f}; SD teórica={np.sqrt(varianza):.3f}")
print(f"Primera muestra: SE intercepto={np.sqrt(s2[0]*(1/n+x.mean()**2/Sxx)):.3f}; SE pendiente={np.sqrt(s2[0]/Sxx):.3f}; SE intercepto centrado={np.sqrt(s2[0]/n):.3f}")
print("Mayor diferencia entre predicciones originales y centradas:",np.max(abs((b0[0]+b[0]*x)-(centro[0]+b[0]*xc))))
g=np.linspace(min(0,x_min),max(0,x_max),200)
sd_media=sigma*np.sqrt(1/n+(g-x.mean())**2/Sxx)
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
ax[0].hist(b0-beta0,bins=40,density=True,histtype="step",label="Error al predecir media en x=0")
ax[0].hist(centro-(beta0+beta1*x.mean()),bins=40,density=True,histtype="step",label="Error al predecir media en xbar")
ax[0].axvline(0,color="black",ls="--");ax[0].set(xlabel="Estimación menos su propio valor verdadero",ylabel="Densidad",title="Dos interceptos, dos preguntas");ax[0].legend(fontsize=7)
ax[1].plot(g,sd_media);ax[1].axvspan(x_min,x_max,alpha=.1,label="Rango de datos")
ax[1].axvline(x.mean(),color="C1",ls="--",label="Centro xbar")
ax[1].set(xlabel="Valor x donde predecimos la media",ylabel="SD verdadera del estimador de la media",title="Más lejos del centro, menos precisión");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: conocer bien la pendiente no implica conocer bien el valor en x=0 cuando ese punto está lejos de los datos. Centrar x hace que el intercepto describa la media en xbar, una pregunta normalmente más precisa; no agrega información ni cambia las predicciones. El gráfico mide incertidumbre de la media estimada, no dispersión de individuos. Fuera del rango observado, además dependemos de que la recta siga siendo válida.")`
}
];
A4V_LABS.forEach(example=>ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",classNumber:4,filename:example.title+".py"}));
