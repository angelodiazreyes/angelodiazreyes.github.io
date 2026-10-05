// Clase 4: regresión simple. Las cadenas se unen antes de mostrarlas en el editor.
const A4_IMPORTS=String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
np.set_printoptions(precision=4, suppress=True)
`;
const A4_FIT=String.raw`
def ajustar(x,y):
    x,y=np.asarray(x,dtype=float),np.asarray(y,dtype=float)
    if x.ndim!=1 or y.shape!=x.shape or len(x)<3: raise ValueError("Usa vectores x e y de igual longitud, con al menos 3 observaciones.")
    xc,yc=x-x.mean(),y-y.mean()
    Sxx=xc@xc
    if Sxx<1e-12: raise ValueError("Sin variación en x no podemos estimar una pendiente.")
    b1=(xc@yc)/Sxx; b0=y.mean()-b1*x.mean()
    pred=b0+b1*x;res=y-pred
    R2=1-(res@res)/(yc@yc) if yc@yc>0 else np.nan
    SER=np.sqrt((res@res)/(len(x)-2))
    return b0,b1,pred,res,R2,SER
`;
const A4_LABS=[
{
 id:"a4-cef",title:"01 Clase 4 · Media condicional: personas y promedios",
 description:"Slides 8–18 y 85. Salarios hipotéticos en miles de pesos. Cambia la cantidad por grupo y el ruido: las medias de grupo aproximan la CEF y la media total pondera según tamaños.",
 code:A4_IMPORTS+String.raw`educ=np.array([10,12,14,16,18])
medias=np.array([700,850,1000,1160,1300.])
cantidades=np.array([100,300,400,150,50])  # Puede modificar; enteros positivos
sigma=180.0
if len(medias)!=len(educ) or cantidades.shape!=educ.shape or np.any(cantidades<1) or np.any(cantidades!=cantidades.astype(int)) or sigma<0:
    raise ValueError("Un promedio y una cantidad entera positiva por nivel; sigma>=0.")
x=np.repeat(educ,cantidades.astype(int));m=np.repeat(medias,cantidades.astype(int))
y=m+rng.normal(0,sigma,len(x))
observadas=np.array([y[x==g].mean() for g in educ]);pesos=cantidades/cantidades.sum()
print("Educación | media poblacional | media muestral | peso")
for g,mu,obs,p in zip(educ,medias,observadas,pesos): print(g,mu,round(obs,2),round(p,3))
print(f"Media muestra={y.mean():.2f}; medias de grupo ponderadas={pesos@observadas:.2f}; media poblacional con estos pesos={pesos@medias:.2f}")
fig,ax=plt.subplots(figsize=(9,4))
ax.scatter(x+rng.uniform(-.15,.15,len(x)),y,s=9,alpha=.15,label="Personas (desplazamiento visual)")
ax.plot(educ,medias,"o-",label="CEF verdadera");ax.plot(educ,observadas,"s--",label="Medias de la muestra")
ax.axhline(y.mean(),color="gray",label="Media total")
ax.set(xlabel="Educación (años)",ylabel="Salario (miles de pesos)",title="El promedio del grupo no es el salario de cada persona")
ax.legend(fontsize=8);fig.tight_layout()
print("Conclusión: saber educación mejora nuestra referencia sobre el salario, pero todavía hay diferencias entre personas del mismo grupo. Si cambia el peso de los grupos, cambia la media total aunque ninguna media de grupo cambie. Estas diferencias describen asociación; no prueban que estudiar cause el aumento.")`
},
{
 id:"a4-blp",title:"02 Clase 4 · CEF curva y mejor predictor lineal",
 description:"Slides 16–24. La CEF es 1+x+c*x² y x es uniforme entre -2 y 2. Cambia c; compara predicción poblacional y error en datos nuevos. Una función curva puede ser lineal en sus parámetros.",
 code:A4_IMPORTS+String.raw`n,c,sigma=1000,.8,1.0
if n<3 or sigma<0: raise ValueError("Usa n>=3 y sigma>=0.")
x=rng.uniform(-2,2,n);m=1+x+c*x**2;y=m+rng.normal(0,sigma,n)
# E[X]=0, E[X²]=4/3, E[X³]=0: BLP poblacional = 1+c*4/3+x
blp=1+c*4/3+x;constante=np.full(n,1+c*4/3)
riesgos=[np.mean((y-p)**2) for p in [m,blp,constante]]
print("ECM simulado [CEF, BLP, solo media]:",np.round(riesgos,3))
print("ECM poblacional exacto:",[sigma**2,sigma**2+c**2*64/45,sigma**2+4/3+c**2*64/45])
fig,ax=plt.subplots(1,2,figsize=(10,4));g=np.linspace(-2,2,200)
ax[0].scatter(x,y,s=6,alpha=.15);ax[0].plot(g,1+g+c*g**2,label="CEF");ax[0].plot(g,1+c*4/3+g,label="BLP")
ax[0].set(xlabel="x",ylabel="y",title="Una recta resume, pero puede perder curvatura");ax[0].legend()
ax[1].bar(["CEF","BLP","Media"],riesgos);ax[1].set(ylabel="Error cuadrático medio",title="Predictores poblacionales evaluados en datos simulados")
fig.tight_layout()
print("Conclusión: la CEF aprovecha todo el patrón promedio; la mejor recta solo aprovecha su parte lineal. Al poner c=0 coinciden. La CEF minimiza el error esperado, aunque una muestra finita puede alterar el orden observado. Escribir una curva con x² sigue siendo lineal en los coeficientes que multiplican 1, x y x².")`
},
{
 id:"a4-calculo",title:"03 Clase 4 · MCO paso a paso con los datos de las slides",
 description:"Slides 41–54. Reproduce la tabla de la diapositiva 50. Puedes modificar x e y; imprime desviaciones, productos, pendiente e intercepto, y compara con la solución matricial.",
 code:A4_IMPORTS+String.raw`x=np.array([11,12,11,8,12,16,18,12,12,17,16,13,12,12,12.])
y=np.array([3.10,3.24,3,6,5.30,8.75,11.25,5,3.60,18.18,6.25,8.13,8.77,5.50,22.20])
`+A4_FIT+String.raw`
b0,b1,pred,res,R2,SER=ajustar(x,y)
xc,yc=x-x.mean(),y-y.mean()
print("Columnas: x, y, x-xbar, y-ybar, producto, (x-xbar)²")
print(np.column_stack([x,y,xc,yc,xc*yc,xc**2]))
print(f"Numerador={xc@yc:.4f}; denominador={xc@xc:.4f}")
print(f"Recta: y_hat={b0:.4f}+{b1:.4f}*x")
X=np.column_stack([np.ones(len(x)),x])
print("X'X:\n",X.T@X,"\nX'y:",X.T@y,"\nMCO matricial:",np.linalg.lstsq(X,y,rcond=None)[0])
fig,ax=plt.subplots(figsize=(8,4));orden=np.argsort(x)
ax.scatter(x,y);ax.plot(x[orden],pred[orden],color="C1",label="MCO")
ax.scatter([x.mean()],[y.mean()],marker="X",s=100,label="Punto de medias")
ax.set(xlabel="Educación (años)",ylabel="Salario (unidades de la tabla)",title="La pendiente compara covariación con variación de x")
ax.legend();fig.tight_layout()
print("Conclusión: una pendiente positiva aparece cuando x e y suelen estar por encima o por debajo de sus medias al mismo tiempo. El intercepto acomoda la recta para pasar por las medias. Si todos tienen la misma educación, no hay comparación que permita aprender una pendiente. Aquí x=0 queda fuera de los datos: interpretar el intercepto como salario real requiere extrapolar.")`
},
{
 id:"a4-src",title:"04 Clase 4 · Elegir la recta: residuos y función objetivo",
 description:"Slides 31–45. Modifica la recta propuesta. Observa distancias verticales y el mapa de suma de residuos cuadrados. El mínimo MCO se calcula exactamente; la cuadrícula solo lo ilustra.",
 code:A4_IMPORTS+String.raw`x=np.array([1,2,3,4,5,6.]);y=np.array([2,4,4,6,7,9.])
b0_propuesto,b1_propuesto=0.0,1.0
`+A4_FIT+String.raw`
b0,b1,pred,res,R2,SER=ajustar(x,y);propuesta=b0_propuesto+b1_propuesto*x
print(f"SRC propuesta={np.sum((y-propuesta)**2):.3f}; SRC MCO={res@res:.3f}")
print("Residuos MCO:",res,"; suma:",res.sum())
print("Los residuos [10,-10,8,-8] suman 0, pero sus cuadrados suman",10**2+10**2+8**2+8**2)
g0=np.linspace(min(b0-3,b0_propuesto-1),max(b0+3,b0_propuesto+1),100)
g1=np.linspace(min(b1-1,b1_propuesto-.5),max(b1+1,b1_propuesto+.5),100)
A,C=np.meshgrid(g0,g1);S=np.sum((y[:,None,None]-A-C*x[:,None,None])**2,axis=0)
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].scatter(x,y);ax[0].plot(x,pred,label="MCO");ax[0].plot(x,propuesta,"--",label="Propuesta")
ax[0].vlines(x,pred,y,color="gray");ax[0].set(xlabel="x",ylabel="y",title="Residuos: distancias verticales");ax[0].legend()
ax[1].contour(A,C,S,levels=20);ax[1].scatter([b0,b0_propuesto],[b1,b1_propuesto],c=["C0","C1"])
ax[1].set(xlabel="Intercepto candidato",ylabel="Pendiente candidata",title="SRC: el punto azul es el mínimo")
fig.tight_layout()
print("Conclusión: sumar errores con signo permite que se cancelen, incluso si la recta predice mal. Elevarlos al cuadrado evita esa cancelación y penaliza más los errores grandes. MCO busca el menor total de cuadrados; no exige acertar en cada persona.")`
},
{
 id:"a4-residuos",title:"05 Clase 4 · Error verdadero y residuo: cero no prueba exogeneidad",
 description:"Slides 14–15, 30, 56 y 63–67. delta conecta x con el error estructural. Cambia delta a cero y compara el error conocido en la simulación con los residuos MCO.",
 code:A4_IMPORTS+String.raw`n,beta,delta=500,2.0,1.0
if n<3: raise ValueError("Usa n>=3.")
x=rng.normal(size=n);e=rng.normal(size=n);u=delta*x+e;y=1+beta*x+u
`+A4_FIT+String.raw`
b0,b1,pred,res,R2,SER=ajustar(x,y)
print(f"Beta estructural={beta}; MCO={b1:.3f}; límite MCO={beta+delta}")
print(f"Media error verdadero={u.mean():.4f}; media residuo={res.mean():.2e}")
print(f"Cov(x,u) muestral={np.mean((x-x.mean())*(u-u.mean())):.4f}; x'residuo={x@res:.2e}")
print(f"Media y={y.mean():.4f}; predicción en media x={b0+b1*x.mean():.4f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].scatter(x,u,s=8,alpha=.25);ax[0].set(xlabel="x",ylabel="u verdadero",title="El error estructural puede estar relacionado con x")
ax[1].scatter(x,res,s=8,alpha=.25);ax[1].axhline(0,color="C1");ax[1].set(xlabel="x",ylabel="Residuo estimado",title="MCO elimina su relación lineal muestral con x")
fig.tight_layout()
print("Conclusión: MCO absorbe en la pendiente la parte del error que se mueve con x. Después del ajuste, los residuos quedan equilibrados por construcción aunque la pendiente mezcle efectos. Ver residuos de media cero o correlación cero con x no demuestra que el error poblacional sea exógeno.")`
},
{
 id:"a4-r2",title:"06 Clase 4 · R² y SER: ajuste y ruido",
 description:"Slides 57–62. Cambia sigma y beta. Compara variación total, explicada y residual. Observa también que R² puede subir o bajar al incorporar nuevas observaciones.",
 code:A4_IMPORTS+String.raw`n,beta,sigma=1000,2.0,3.0
if n<30 or sigma<=0: raise ValueError("Usa n>=30 y sigma>0.")
x=rng.normal(size=n);y=1+beta*x+rng.normal(0,sigma,n)
`+A4_FIT+String.raw`
b0,b1,pred,res,R2,SER=ajustar(x,y)
SCT=np.sum((y-y.mean())**2);SCE=np.sum((pred-y.mean())**2);SCR=res@res
print(f"SCT={SCT:.3f}; SCE+SCR={SCE+SCR:.3f}; R²={R2:.3f}; SER={SER:.3f}")
print(f"R² poblacional={beta**2/(beta**2+sigma**2):.3f}; pendiente verdadera={beta}")
tamanos=np.unique(np.linspace(20,n,80).astype(int));r2s=[ajustar(x[:m],y[:m])[4] for m in tamanos]
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].bar(["Explicada","Residual"],[SCE/SCT,SCR/SCT]);ax[0].set(ylabel="Proporción de variación total",ylim=(0,1),title="Descomposición con intercepto")
ax[1].plot(tamanos,r2s);ax[1].axhline(beta**2/(beta**2+sigma**2),color="C1",ls="--")
ax[1].set(xlabel="Observaciones acumuladas",ylabel="R² muestral",title="Agregar observaciones no garantiza subir R²")
fig.tight_layout()
print("Conclusión: R² indica cuánto mejora la recta frente a predecir siempre la media; SER expresa la dispersión residual en unidades de y. Más ruido puede bajar R² sin cambiar el efecto verdadero. R² no prueba causalidad ni crece necesariamente con n; la propiedad de no disminuir al agregar regresores se refiere a la misma muestra y variable dependiente.")`
},
{
 id:"a4-precision",title:"07 Clase 4 · Qué hace más precisa una pendiente",
 description:"Slides 53, 83–89 y 92. Repite muestras con diferentes n, dispersión de x y ruido. B es la cantidad de regresiones repetidas. Compara distribución de pendientes y SE homocedástico promedio.",
 code:A4_IMPORTS+String.raw`B,beta=500,2.0
escenarios=[(50,1.,1.),(500,1.,1.),(50,3.,1.),(50,1.,3.)]  # (n,SD de x,SD del error)
if B<2 or any(n<3 or sx<=0 or su<=0 or n*B>2000000 for n,sx,su in escenarios): raise ValueError("Usa B>=2,n>=3, desviaciones>0 y B*n<=2 millones.")
resultados=[];etiquetas=[]
for n,sx,su in escenarios:
    x=rng.normal(0,sx,(B,n));u=rng.normal(0,su,(B,n));y=1+beta*x+u
    xc=x-x.mean(axis=1,keepdims=True);yc=y-y.mean(axis=1,keepdims=True);Sxx=np.sum(xc**2,axis=1)
    b=np.sum(xc*yc,axis=1)/Sxx;res=yc-b[:,None]*xc
    se=np.sqrt(np.sum(res**2,axis=1)/(n-2)/Sxx)
    resultados.append(b);etiquetas.append(f"n={n}\nSDx={sx}, SDu={su}")
    print(f"{etiquetas[-1]}: promedio beta={b.mean():.3f}; SD entre muestras={b.std(ddof=1):.3f}; SE promedio={se.mean():.3f}")
fig,ax=plt.subplots(figsize=(10,4));ax.boxplot(resultados,showfliers=True);ax.set_xticks(np.arange(1,len(etiquetas)+1),etiquetas)
ax.axhline(beta,color="C1",ls="--");ax.set(ylabel="Pendiente estimada",title="Más observaciones o más contraste en x aportan precisión")
fig.tight_layout()
print("Conclusión: es más fácil aprender cómo cambia y cuando tenemos más personas o valores de x más distintos. El ruido dificulta separar señal y azar. Insesgadez significa acertar en promedio entre muestras; no significa acertar en cada muestra. SE estima cuánto cambiaría la pendiente al repetir el muestreo.")`
},
{
 id:"a4-outlier",title:"08 Clase 4 · Un punto extremo puede mover la recta",
 description:"Slide 69. Cambia x_nuevo e y_nuevo y compara el ajuste con y sin ese punto. Alta palanca y gran residuo conjuntamente pueden producir mucha influencia.",
 code:A4_IMPORTS+String.raw`n,x_nuevo,y_nuevo=50,15.0,-10.0
if n<3: raise ValueError("Usa n>=3.")
x=rng.uniform(0,5,n);y=1+2*x+rng.normal(0,1,n)
`+A4_FIT+String.raw`
b0,b1,*_=ajustar(x,y);xx=np.append(x,x_nuevo);yy=np.append(y,y_nuevo)
c0,c1,*_=ajustar(xx,yy)
h=1/len(xx)+(x_nuevo-xx.mean())**2/np.sum((xx-xx.mean())**2)
print(f"Pendiente original={b1:.3f}; con punto nuevo={c1:.3f}; palanca del punto={h:.3f}")
g=np.linspace(xx.min(),xx.max(),200);fig,ax=plt.subplots(figsize=(8,4))
ax.scatter(x,y,label="Datos iniciales");ax.scatter([x_nuevo],[y_nuevo],color="red",s=90,label="Punto agregado")
ax.plot(g,b0+b1*g,label="Sin punto");ax.plot(g,c0+c1*g,label="Con punto")
ax.set(xlabel="x",ylabel="y",title="La sensibilidad depende de la ubicación del punto");ax.legend();fig.tight_layout()
print("Conclusión: un punto lejos del centro de x tiene capacidad de inclinar la recta, especialmente si contradice su patrón. Prueba situarlo sobre la recta: ser extremo no implica siempre gran cambio. La sensibilidad invita a revisar el dato y el modelo; no justifica borrar automáticamente observaciones incómodas.")`
},
{
 id:"a4-unidades",title:"09 Clase 4 · Cambiar unidades sin cambiar la relación",
 description:"Slides 73–77. cy cambia la unidad de y y cx la de x. Ejemplo: de miles de pesos a pesos, cy=1000; de años a meses, cx=12. R² se conserva.",
 code:A4_IMPORTS+String.raw`n,cx,cy=200,12.0,1000.0
if n<3 or cx<=0 or cy<=0: raise ValueError("Usa n>=3 y factores positivos.")
x=rng.uniform(8,18,n);y=280+62*x+rng.normal(0,180,n)
`+A4_FIT+String.raw`
b0,b1,pred,res,r2,ser=ajustar(x,y)
c0,c1,pred2,res2,r22,ser2=ajustar(cx*x,cy*y)
print("Original [intercepto,pendiente,R²,SER]:",[b0,b1,r2,ser])
print("Nueva unidad:",[c0,c1,r22,ser2])
print("Esperado: intercepto*cy, pendiente*cy/cx:",[cy*b0,cy/cx*b1])
print("Mayor diferencia de predicciones, devueltas a unidad original:",np.max(abs(pred2/cy-pred)))
fig,ax=plt.subplots(1,2,figsize=(10,4));orden=np.argsort(x)
for eje,X,Y,P,titulo in [(ax[0],x,y,pred,"Unidades originales"),(ax[1],cx*x,cy*y,pred2,"Unidades transformadas")]:
    eje.scatter(X,Y,s=10,alpha=.3);eje.plot(X[orden],P[orden],color="C1");eje.set(xlabel="x",ylabel="y",title=titulo)
fig.tight_layout()
print("Conclusión: la cifra de la pendiente depende de la regla de medición. Un mes y un año no representan el mismo cambio; pesos y miles de pesos tampoco. Las predicciones físicas y R² se mantienen, aunque cambien los números de los coeficientes y del SER.")`
},
{
 id:"a4-log",title:"10 Clase 4 · Niveles y logaritmos: interpretar el cambio",
 description:"Slides 24 y 78–80. Cambia modelo entre nivel-nivel, nivel-log, log-nivel y log-log. Compara cambios exactos y aproximaciones; para log(y) la curva exponenciada describe la mediana condicional del modelo simulado.",
 code:A4_IMPORTS+String.raw`modelo="log-nivel"
n,beta,sigma,x0,dx=1000,.08,.25,10.0,1.0
opciones=["nivel-nivel","nivel-log","log-nivel","log-log"]
if modelo not in opciones or n<3 or sigma<=0 or x0<=0 or x0+dx<=0: raise ValueError("Revisa modelo, n>=3, sigma>0 y valores positivos de x.")
logy=modelo.startswith("log-");logx=modelo.endswith("-log")
x=rng.uniform(5,20,n);X=np.log(x) if logx else x
Y=1+beta*X+rng.normal(0,sigma,n);y=np.exp(Y) if logy else Y
`+A4_FIT+String.raw`
b0,b1,pred,res,R2,SER=ajustar(X,Y)
deltaX=np.log((x0+dx)/x0) if logx else dx
cambio=b1*deltaX
exacto=100*np.expm1(cambio) if logy else cambio
aprox=100*b1*(dx/x0 if logx else dx) if logy else b1*(dx/x0 if logx else dx)
unidad="% en mediana de y" if logy else "unidades de y"
print(f"Modelo={modelo}; beta estimado={b1:.4f}; x pasa de {x0} a {x0+dx}")
print(f"Cambio exacto={exacto:.4f} {unidad}; aproximación={aprox:.4f}")
g=np.linspace(min(5,x0),max(20,x0+dx),250);eta=b0+b1*(np.log(g) if logx else g)
curva=np.exp(eta) if logy else eta
fig,ax=plt.subplots(figsize=(9,4));ax.scatter(x,y,s=7,alpha=.15)
ax.plot(g,curva,color="C1",label="Mediana condicional ajustada" if logy else "Media condicional ajustada")
if logy: ax.plot(g,np.exp(eta+sigma**2/2),ls="--",label="Media: corrección con sigma conocido")
ax.set(xlabel="x (nivel)",ylabel="y (nivel)",title=modelo);ax.legend();fig.tight_layout()
print("Conclusión: con log(y) hablamos de cambios porcentuales; con log(x), de cambios relativos en x. Las reglas habituales son aproximaciones para cambios pequeños. Exponenciar la predicción de log(y) no entrega automáticamente la media de y: aquí la media requiere exp(sigma²/2), porque el error logarítmico es normal con varianza constante.")`
},
{
 id:"a4-iid",title:"11 Clase 4 · Muestreo: muchas personas no siempre son mucha información",
 description:"Slides 64 y 68. Personas agrupadas en G escuelas, con m personas por escuela. x es compartida en cada escuela y el error incluye un shock común. Contrasta SE ingenuo con SD verdadera condicional conocida por el simulador.",
 code:A4_IMPORTS+String.raw`G,m,B,beta,sd_grupo=30,10,400,2.0,2.0
if G<3 or m<1 or B<2 or sd_grupo<0 or G*m*B>2000000: raise ValueError("Usa G>=3,m>=1,B>=2,sd_grupo>=0 y G*m*B<=2 millones.")
`+A4_FIT+String.raw`
pendientes=[];ingenuos=[];oraculos=[]
# Fijamos x para comparar incertidumbre condicional entre muestras de errores.
xg=rng.normal(size=G);x=np.repeat(xg,m);xc=x-x.mean();Sxx=xc@xc
se_real=np.sqrt(sd_grupo**2*np.sum((m*(xg-xg.mean()))**2)+Sxx)/Sxx
for _ in range(B):
    u=np.repeat(rng.normal(0,sd_grupo,G),m)+rng.normal(size=G*m)
    b0,b1,pred,res,r2,ser=ajustar(x,1+beta*x+u)
    pendientes.append(b1);ingenuos.append(ser/np.sqrt(Sxx))
print(f"Personas={G*m}; grupos independientes={G}; SD entre muestras={np.std(pendientes,ddof=1):.3f}")
print(f"SE ingenuo promedio={np.mean(ingenuos):.3f}; SD condicional verdadera={se_real:.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].hist(pendientes,bins=30);ax[0].axvline(beta,color="C1");ax[0].set(xlabel="Pendiente",ylabel="Frecuencia",title="La pendiente varía entre muestras")
ax[1].bar(["Ingenuo","Verdadero\n(solo simulación)"],[np.mean(ingenuos),se_real]);ax[1].set(ylabel="Desviación estándar",title="Compartir shocks reduce información independiente")
fig.tight_layout()
print("Conclusión: personas de la misma escuela comparten parte de la suerte. Contarlas como observaciones totalmente independientes exagera la precisión. Agregar personas dentro de una escuela no equivale a agregar escuelas independientes. En datos reales usaríamos inferencia apropiada para grupos; aquí conocemos la incertidumbre verdadera porque construimos el modelo.")`
},
{
 id:"a4-inferencia",title:"12 Clase 4 · Prueba t, p-valor e intervalos de confianza",
 description:"Slides 90–95. Repite B regresiones con errores normales, independientes y homocedásticos. Cambia beta, beta_nula y n. La t con n-2 grados es exacta bajo estos supuestos y x fija.",
 code:A4_IMPORTS+String.raw`from scipy.stats import t as student
n,B,beta,beta_nula,sigma=80,500,.3,0.0,1.0
if n<3 or B<2 or sigma<=0 or n*B>2000000: raise ValueError("Usa n>=3,B>=2,sigma>0 y n*B<=2 millones.")
x=rng.normal(size=n);xc=x-x.mean();Sxx=xc@xc
y=1+beta*x+rng.normal(0,sigma,(B,n));yc=y-y.mean(axis=1,keepdims=True)
b=(yc@xc)/Sxx;res=yc-b[:,None]*xc
se=np.sqrt(np.sum(res**2,axis=1)/(n-2)/Sxx)
tstat=(b-beta_nula)/se;pval=2*student.sf(abs(tstat),df=n-2)
crit=student.ppf(.975,df=n-2);lo=b-crit*se;hi=b+crit*se
cubre=(lo<=beta)&(beta<=hi)
print(f"Primera muestra: beta_hat={b[0]:.3f}; SE={se[0]:.3f}; t={tstat[0]:.3f}; p={pval[0]:.4f}; IC=[{lo[0]:.3f},{hi[0]:.3f}]")
print(f"Cobertura del beta verdadero={cubre.mean():.3f}; fracción rechazos H0={np.mean(pval<.05):.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4));j=np.arange(min(40,B))
for i in j: ax[0].plot([lo[i],hi[i]],[i,i],color="C0" if cubre[i] else "C3")
ax[0].axvline(beta,color="black",ls="--");ax[0].set(xlabel="Intervalo para beta",ylabel="Muestra",title="Azul: cubre verdad; rojo: no cubre")
ax[1].hist(pval,bins=np.linspace(0,1,21));ax[1].axvline(.05,color="C1");ax[1].set(xlabel="p-valor",ylabel="Frecuencia",title="Prueba bilateral")
fig.tight_layout()
print("Conclusión: un intervalo al 95% es un procedimiento que cubre el parámetro fijo aproximadamente en 95 de cada 100 muestras bajo los supuestos. El p-valor pregunta cuán extremo es el resultado si H0 es cierta; no es la probabilidad de que H0 sea cierta. Pon beta=beta_nula: aun así habrá rechazos por azar. Significancia estadística no demuestra causalidad.")`
},
{
 id:"a4-significancia",title:"13 Clase 4 · Significativo no siempre significa importante",
 description:"Slides 96 y 98. Cambia el efecto beta y el umbral de importancia económica. Mismo modelo, muestras crecientes: el efecto puede ser pequeño aunque el p-valor sea muy bajo.",
 code:A4_IMPORTS+String.raw`from scipy.stats import t as student
beta,sigma,umbral_importante=.03,1.0,.20
tamanos=[50,500,5000,20000]
if sigma<=0 or umbral_importante<=0 or min(tamanos)<3 or max(tamanos)>100000: raise ValueError("Usa sigma,umbral>0 y 3<=n<=100000.")
x=rng.normal(size=max(tamanos));y=1+beta*x+rng.normal(0,sigma,max(tamanos))
`+A4_FIT+String.raw`
estimados=[];margenes=[]
for n in tamanos:
    b0,b1,pred,res,r2,ser=ajustar(x[:n],y[:n]);se=ser/np.sqrt(np.sum((x[:n]-x[:n].mean())**2))
    p=2*student.sf(abs(b1/se),n-2);estimados.append(b1);margenes.append(student.ppf(.975,n-2)*se)
    print(f"n={n}: beta_hat={b1:.4f}, SE={se:.4f}, p={p:.5f}, |beta_hat| supera umbral económico: {abs(b1)>=umbral_importante}")
fig,ax=plt.subplots(figsize=(9,4));j=np.arange(len(tamanos))
ax.axhspan(-umbral_importante,umbral_importante,alpha=.15,label="Efectos pequeños según TU umbral")
ax.errorbar(j,estimados,yerr=margenes,fmt="o",capsize=5);ax.axhline(0,color="gray");ax.axhline(beta,color="C1",ls="--",label="Verdad")
ax.set_xticks(j,tamanos);ax.set(xlabel="Tamaño muestral",ylabel="Efecto por unidad de x e IC 95%",title="La precisión y la importancia responden preguntas distintas")
ax.legend();fig.tight_layout()
print("Conclusión: con suficientes datos podemos detectar efectos diminutos. Un p-valor pequeño habla de evidencia contra cero, no del tamaño ni de la conveniencia económica del efecto. La importancia requiere unidades, costos y contexto; el umbral de este ejercicio es una decisión ilustrativa, no una regla estadística.")`
},
{
 id:"a4-asintotica",title:"14 Clase 4 · Consistencia y normalidad: qué cambia con n",
 description:"Slides 81–89. Ruido exponencial centrado, independiente de x, más delta*x. Cambia delta: con cero hay exogeneidad; con otro valor, aumentar n no corrige el sesgo.",
 code:A4_IMPORTS+String.raw`B,beta,delta=600,2.0,0.0
tamanos=[30,100,500,1500]
if B<2 or min(tamanos)<3 or B*max(tamanos)>2000000: raise ValueError("Usa B>=2,n>=3 y B*max(n)<=2 millones.")
fig,ax=plt.subplots(1,2,figsize=(10,4));limite=beta+delta
for n in tamanos:
    x=rng.normal(size=(B,n));u=delta*x+rng.exponential(size=(B,n))-1;y=1+beta*x+u
    xc=x-x.mean(axis=1,keepdims=True);b=np.sum(xc*y,axis=1)/np.sum(xc**2,axis=1)
    ax[0].hist(b,bins=40,density=True,histtype="step",label=f"n={n}")
    print(f"n={n}: promedio={b.mean():.3f}; SD={b.std(ddof=1):.3f}; límite={limite:.3f}")
    if n==max(tamanos): ax[1].hist(np.sqrt(n)*(b-limite),bins=35,density=True,label="Error reescalado")
g=np.linspace(-4,4,400);ax[1].plot(g,np.exp(-g*g/2)/np.sqrt(2*np.pi),label="N(0,1)")
ax[0].axvline(beta,color="black",ls="--",label="Beta estructural");ax[0].axvline(limite,color="C1",ls=":",label="Límite")
ax[0].set(xlabel="Pendiente estimada",ylabel="Densidad",title="Más datos concentran la estimación")
ax[1].set(xlabel="raíz(n)*(beta_hat-límite)",ylabel="Densidad",title="Normalidad alrededor del límite")
for eje in ax: eje.legend(fontsize=8)
fig.tight_layout()
print("Conclusión: cuando delta=0, más datos permiten acercarse al efecto verdadero aunque los errores individuales no sean normales. Cuando delta no es cero, la estimación se concentra en beta+delta: una campana estrecha puede estar centrada en el lugar equivocado. La normalidad asintótica describe la incertidumbre; no arregla endogeneidad.")`
}
];
A4_LABS.forEach(example=>ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",filename:example.title}));
