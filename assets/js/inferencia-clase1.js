// Clase 1: Revisión MCO. Cada bloque es independiente y editable.
window.ECON_WAGE_URL = document.currentScript.dataset.wageUrl;
// Sustituye los dos ejemplos introductorios de este curso.
for (let i = ECON_PYTHON_EXAMPLES.length - 1; i >= 0; i--) {
  if (ECON_PYTHON_EXAMPLES[i].course === "inferencia-causal") ECON_PYTHON_EXAMPLES.splice(i, 1);
}
const IC_CLASS1 = [
  {
    id: "ic-media", title: "01 Clase 1· Media condicional y LEI", dataset: "wage1",
    description: "Diapositivas 8–18. Puede cambiar grupo por female o exper. Los promedios de grupo se ponderan por su tamaño; no son efectos causales.",
    code: String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Opciones: educ (educación), female (indicador), exper (experiencia)
grupo = "educ"
variable = "wage"  
d = pd.read_csv("wage1.csv")[[grupo, variable]].dropna()
tabla = d.groupby(grupo)[variable].agg(["mean", "count"])
tabla["peso"] = tabla["count"] / len(d)
media = d[variable].mean()
ponderada = (tabla["mean"] * tabla["peso"]).sum()
print("wage1: CPS 1976, salarios por hora en dólares de 1976.")
print(tabla.round(4).to_string())
print(f"Media total = {media:.6f}; suma ponderada = {ponderada:.6f}")
print("LEI muestral: la igualdad es exacta salvo redondeo.")
fig, ax = plt.subplots(figsize=(8, 4.5))
ax.scatter(d[grupo], d[variable], alpha=.15, s=12, label="Observaciones")
ax.plot(tabla.index, tabla["mean"], "o-", color="#e85d3f", label="Media por grupo")
ax.axhline(media, color="#183153", ls="--", label="Media total")
ax.set(xlabel=grupo, ylabel=variable, title="Estimación de E[Y|X] por grupos")
ax.legend(); fig.tight_layout()`
  },
  {
    id: "ic-simple", title: "02 Clase 1· Dispersión y recta MCO", dataset: "wage1",
    description: "Diapositivas 21–40. Cambia x_nombre o y_nombre y compara la recta MCO con una recta propuesta. Por ejemplo por exper, female. SRC mide la suma de residuos al cuadrado.",
    code: String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Opción: Puede cambiar estos parámetros y vuelve a ejecutar
x_nombre, y_nombre = "educ", "wage"
b0_propuesto, b1_propuesto = -1.0, 0.6
d = pd.read_csv("wage1.csv")[[x_nombre, y_nombre]].dropna()
x, y = d[x_nombre].to_numpy(), d[y_nombre].to_numpy()
xc, yc = x-x.mean(), y-y.mean()
if xc @ xc == 0:
    raise ValueError("x debe variar para identificar una pendiente.")
b1 = (xc @ yc) / (xc @ xc)
b0 = y.mean()-b1*x.mean()
ajuste = b0+b1*x
residuo = y-ajuste
src = residuo @ residuo
r2 = 1-src/(yc @ yc)
print(f"n={len(x)}; beta0_hat={b0:.4f}; beta1_hat={b1:.4f}")
print(f"SRC MCO={src:.4f}; R²={r2:.4f}")
print(f"SRC recta propuesta={np.sum((y-b0_propuesto-b1_propuesto*x)**2):.4f}")
print(f"Suma de residuos={residuo.sum():.2e}; x'residuo={x @ residuo:.2e}")
print("Asociación descriptiva: educación no fue asignada aleatoriamente.")
fig, ax = plt.subplots(figsize=(8, 4.5))
ax.scatter(x, y, s=13, alpha=.3, label="wage1")
xx = np.linspace(x.min(), x.max(), 100)
ax.plot(xx, b0+b1*xx, color="#e85d3f", label="Recta MCO")
ax.plot(xx, b0_propuesto+b1_propuesto*xx, "--", color="gray", label="Tu recta")
ax.vlines(x[:20], ajuste[:20], y[:20], alpha=.4, label="20 residuos")
ax.set(xlabel=x_nombre, ylabel=y_nombre, title="MCO minimiza la SRC")
ax.legend(); fig.tight_layout()`
  },
  {
    id: "ic-matriz-simple", title: "03 Clase 1· Beta paso a paso: matrices",
    description: "Diapositivas 28, 39 y 47–49. Puede modificar los valores de x e y. Se construye X, X′X, su inversa, X′y y beta_hat; la pendiente coincide con covarianza/varianza.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
np.set_printoptions(precision=3, suppress=True)

# Puede cambiar los valores; Importante: conserva igual cantidad de x e y
x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 4, 6, 7], dtype=float)
if x.ndim != 1 or y.shape != x.shape:
    raise ValueError("x e y deben ser vectores de igual longitud.")
X = np.column_stack([np.ones(len(x)), x])
if np.linalg.matrix_rank(X) < 2:
    raise ValueError("X no tiene rango completo: prueba valores distintos de x.")
XtX, Xty = X.T @ X, X.T @ y
inversa = np.linalg.inv(XtX)  # Mostrar para su conocimiento
beta = np.linalg.solve(XtX, Xty)
referencia = np.linalg.lstsq(X, y, rcond=None)[0]
pendiente = ((x-x.mean()) @ (y-y.mean())) / np.sum((x-x.mean())**2)
for nombre, matriz in [("X", X), ("y", y[:,None]), ("X'X", XtX),
                        ("(X'X)^-1", inversa), ("X'y", Xty[:,None]),
                        ("beta_hat", beta[:,None])]:
    print(nombre, "=\n", matriz)
print(f"beta1_hat por cov/var = {pendiente:.6f}")
print("Verificación con lstsq:", referencia)
print("Residuos:", y-X@beta)
fig, ax = plt.subplots(figsize=(7, 4))
ax.scatter(x, y, s=70, label="Datos editables")
orden = np.argsort(x)
ax.plot(x[orden], (X@beta)[orden], color="#e85d3f", label="Ajuste MCO")
ax.vlines(x, X@beta, y, color="gray", linestyles="dashed")
ax.set(xlabel="x", ylabel="y", title="Cambia los vectores y observa la recta")
ax.legend(); fig.tight_layout()`
  },
  {
    id: "ic-matriz-multiple", title: "04 Clase 1· Matriz múltiple editable",
    description: "Diapositivas 42–54. Cambia X e y; cada fila es una observación y la primera columna es el intercepto. Observa también los residuos y sus condiciones de ortogonalidad.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
np.set_printoptions(precision=3, suppress=True)

# CAMBIA X e y; columnas: constante, x1, x2
X = np.array([[1,1,2], [1,2,1], [1,3,4],
              [1,4,2], [1,5,5], [1,6,3]], dtype=float)
y = np.array([4.2, 3.7, 8.5, 6.8, 10.4, 10.2], dtype=float)
if X.ndim != 2 or y.shape != (X.shape[0],):
    raise ValueError("Debe haber un valor de y por cada fila de X.")
n, p = X.shape
if n <= p or np.linalg.matrix_rank(X) < p:
    raise ValueError("Se necesita n>p y columnas linealmente independientes.")
XtX, Xty = X.T@X, X.T@y
beta = np.linalg.lstsq(X, y, rcond=None)[0]
inversa = np.linalg.inv(XtX)
u = y-X@beta
s2 = (u@u)/(n-p)
se = np.sqrt(np.diag(s2*inversa))
for nombre, matriz in [("X",X), ("y",y[:,None]), ("X'X",XtX),
                        ("(X'X)^-1",inversa), ("X'y",Xty[:,None]),
                        ("beta_hat",beta[:,None]), ("X'residuos",X.T@u)]:
    print(nombre, "=\n", matriz)
print("Comprobación fórmula:", inversa@Xty)
print("Errores estándar clásicos (suponen homocedasticidad):", se)
print("Columnas: y, ajuste, residuo\n", np.column_stack([y,X@beta,u]))
fig, axes = plt.subplots(1,2,figsize=(9,4))
axes[0].scatter(y, X@beta)
lim = [min(y.min(), (X@beta).min()), max(y.max(), (X@beta).max())]
axes[0].plot(lim, lim, "--", color="gray")
axes[0].set(xlabel="y observado", ylabel="y ajustado", title="Ajuste múltiple")
axes[1].bar(np.arange(1,n+1), u)
axes[1].axhline(0,color="gray")
axes[1].set(xlabel="Observación", ylabel="Residuo", title="Lo que el modelo no explica")
fig.tight_layout()`
  },
  {
    id: "ic-multiple-real", title: "05 Clase 1· Múltiple y efecto parcial", dataset: "wage1",
    description: "Diapositivas 42–49. Regresión salarial con controles y demostración de Frisch–Waugh–Lovell. Puede cambiar la lista de controles; se muestran las primeras filas de X y los productos completos.",
    code: String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
np.set_printoptions(precision=3, suppress=True)

objetivo = "educ"
controles = ["exper", "tenure"]  # Opción: añade female, married, etc.
dependiente = "lwage"
if objetivo in controles or len(set(controles)) != len(controles) or dependiente in [objetivo]+controles:
    raise ValueError("Usa variables distintas, sin repetir controles ni incluir y.")
d = pd.read_csv("wage1.csv")[[dependiente,objetivo]+controles].dropna()
y, x = d[dependiente].to_numpy(), d[objetivo].to_numpy()
Z = np.column_stack([np.ones(len(d)), d[controles].to_numpy()])
X = np.column_stack([Z[:,0], x, Z[:,1:]])
if np.linalg.matrix_rank(X) < X.shape[1]:
    raise ValueError("Los controles producen colinealidad perfecta.")
beta = np.linalg.lstsq(X,y,rcond=None)[0]
rx = x-Z@np.linalg.lstsq(Z,x,rcond=None)[0]
ry = y-Z@np.linalg.lstsq(Z,y,rcond=None)[0]
parcial = (rx@ry)/(rx@rx)
print("n =",len(d), "; columnas:", ["constante",objetivo]+controles)
print("Primeras 8 filas X:\n",X[:8], "\nPrimeros 8 valores y:\n",y[:8])
print("X'X completo:\n", X.T@X, "\nX'y:\n",X.T@y)
print("Coeficientes:\n",pd.Series(beta,index=["constante",objetivo]+controles).round(5))
print(f"Pendiente parcial FWL = {parcial:.6f}; MCO múltiple = {beta[1]:.6f}")
print("Con y=lwage, 100*beta es una variación porcentual aproximada.")
print("Controlar observables no garantiza identificación causal.")
fig,ax=plt.subplots(figsize=(8,4.5))
ax.scatter(rx,ry,s=12,alpha=.3)
xx=np.linspace(rx.min(),rx.max(),100)
ax.plot(xx,parcial*xx,color="#e85d3f")
ax.set(xlabel="x sin la parte explicada por controles",ylabel="y sin la parte explicada por controles",
       title="Relación parcial: misma pendiente que la regresión múltiple")
fig.tight_layout()`
  },
  {
    id: "ic-cef", title: "06 Clase 1· CEF no lineal y predicción",
    description: "Diapositivas 15–22 y 44. Usted puede cambia curvatura: una regresión puede ser lineal en parámetros y curva en x. Compara errores de predicción en una muestra independiente.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n, curvatura, sigma = 300, 1.0, 2.0  # Esto lo puede cambiar
x=rng.uniform(-3,3,n)
cef=lambda z: 1+2*z+curvatura*z**2
y=cef(x)+rng.normal(0,sigma,n)
X1=np.column_stack([np.ones(n),x])
X2=np.column_stack([X1,x**2])
b1=np.linalg.lstsq(X1,y,rcond=None)[0]
b2=np.linalg.lstsq(X2,y,rcond=None)[0]
xt=rng.uniform(-3,3,10000)
yt=cef(xt)+rng.normal(0,sigma,len(xt))
pred1=b1[0]+b1[1]*xt
pred2=b2[0]+b2[1]*xt+b2[2]*xt**2
for nombre,pred in [("CEF verdadera",cef(xt)),("Recta",pred1),("Cuadrática",pred2)]:
    print(nombre, "ECM fuera de muestra:",round(np.mean((yt-pred)**2),4))
print("El error de la CEF es independiente en media de x, no necesariamente independiente.")
xx=np.linspace(-3,3,200)
fig,ax=plt.subplots(figsize=(8,4.5))
ax.scatter(x,y,s=12,alpha=.25)
ax.plot(xx,cef(xx),color="black",label="CEF verdadera")
ax.plot(xx,b1[0]+b1[1]*xx,label="MCO lineal")
ax.plot(xx,b2[0]+b2[1]*xx+b2[2]*xx**2,"--",label="MCO con x²")
ax.set(xlabel="x",ylabel="y",title="CEF y aproximación lineal")
ax.legend();fig.tight_layout()`
  },
  {
    id: "ic-sesgo", title: "07 Clase 1· Sesgo por variable omitida",
    description: "Diapositivas 53–57 y 78–79. Cambia rho y gamma: el sesgo depende de la correlación con la variable omitida y de su efecto. Cada histograma reúne muchas muestras.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n, B = 300, 600  # n obs, B simulaciones
beta1, gamma, rho = 2.0, 1.5, 0.7  # Puede cambiar rho entre -0.99 y 0.99
if not -1 < rho < 1 or n < 5 or B < 2:
    raise ValueError("Se requiere -1<rho<1, n>=5 y B>=2.")
omitida, completa = [], []
for _ in range(B):
    x=rng.normal(size=n)
    z=rho*x+np.sqrt(1-rho**2)*rng.normal(size=n)
    y=1+beta1*x+gamma*z+rng.normal(size=n)
    corto=np.linalg.lstsq(np.column_stack([np.ones(n),x]),y,rcond=None)[0]  # estima y= c + b x+ u
    largo=np.linalg.lstsq(np.column_stack([np.ones(n),x,z]),y,rcond=None)[0] # estima y= c + b x+ t z + u
    omitida.append(corto[1]); completa.append(largo[1])
sesgo=gamma*rho  # Var(x)=Var(z)=1 en esta población
print(f"Verdad beta1={beta1}; sesgo teórico del modelo corto={sesgo:.3f}")
print(f"Media sin z={np.mean(omitida):.3f}; media con z={np.mean(completa):.3f}")
print("Insesgadez se refiere al promedio entre muestras, no al acierto en cada muestra.")
fig,ax=plt.subplots(figsize=(8,4.5))
bins=np.linspace(min(omitida+completa),max(omitida+completa),45)
ax.hist(omitida,bins=bins,alpha=.6,label="Omite z")
ax.hist(completa,bins=bins,alpha=.6,label="Incluye z")
ax.axvline(beta1,color="black",label="Efecto verdadero")
ax.axvline(beta1+sesgo,color="#e85d3f",ls="--",label="Límite al omitir z")
ax.set(xlabel="beta1_hat",ylabel="Frecuencia",title="Más datos no eliminan el sesgo por omisión")
ax.legend();fig.tight_layout()`
  },
  {
    id: "ic-colinealidad", title: "08 Clase 1· Colinealidad y precisión",
    description: "Diapositivas 51–55 y 59–61. Un control irrelevante correlacionado con x mantiene la insesgadez pero reduce precisión. Con rho=1 no se pueden separar los coeficientes.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n, B, beta1 = 150, 500, 2.0
rhos = [0.0, 0.5, 0.9, 0.99]  # Opiones; 1 demuestra colinealidad perfecta. Se está comparando varios niveles de colinealidad
dispersiones, etiquetas = [], []
for rho in rhos:
    if abs(rho)>1: raise ValueError("rho debe estar entre -1 y 1.")
    estimaciones=[]
    for _ in range(B):
        x=rng.normal(size=n)
        z=rho*x+np.sqrt(1-rho**2)*rng.normal(size=n)
        X=np.column_stack([np.ones(n),x,z])
        if np.linalg.matrix_rank(X)<3: break
        y=1+beta1*x+rng.normal(size=n)  # Efecto verdadero de z = 0
        estimaciones.append(np.linalg.lstsq(X,y,rcond=None)[0][1])  # acá se está usando x y z
    if not estimaciones:
        print(f"rho={rho}: X sin rango completo; coeficientes no únicos.")
        continue
    dispersiones.append(estimaciones); etiquetas.append(str(rho))
    print(f"rho={rho}: media={np.mean(estimaciones):.3f}, SD={np.std(estimaciones,ddof=1):.3f}")
    print("\nConclusión: agregar una variable irrelevante no sesga el coeficiente de x,")
    print("pero puede hacerlo mucho menos preciso si está correlacionada con x.")
if dispersiones:
    fig,ax=plt.subplots(figsize=(8,4.5))
    ax.boxplot(dispersiones,showfliers=False)
    ax.set_xticks(np.arange(1,len(etiquetas)+1),etiquetas)
    ax.axhline(beta1,color="#e85d3f",label="Beta verdadero")
    ax.set(xlabel="Correlación entre x y control irrelevante",ylabel="beta1_hat",title="Colinealidad: estimaciones menos precisas")
    ax.legend();fig.tight_layout()`
  },
  {
    id: "ic-hetero", title: "09 Clase 1· Heterocedasticidad y EE",
    description: "Diapositivas 58–66. Cambia hetero a cero para homocedasticidad. Compara errores estándar clásicos con robustos HC1; robustecer los EE no cambia los coeficientes ni resuelve endogeneidad.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
n, hetero, beta1 = 500, 2.0, 2.0  # hetero >= 0
if hetero < 0 or n < 5: raise ValueError("Usa hetero>=0 y n>=5.")
x=rng.uniform(0,5,n)
u=(0.5+hetero*x)*rng.normal(size=n)
y=1+beta1*x+u
X=np.column_stack([np.ones(n),x])
b=np.linalg.lstsq(X,y,rcond=None)[0]
r=y-X@b
bread=np.linalg.inv(X.T@X)
Vclasica=(r@r)/(n-2)*bread
Vhc1=n/(n-2)*bread@(X.T@(r[:,None]**2*X))@bread
se=np.sqrt(np.diag(Vclasica)); robust=np.sqrt(np.diag(Vhc1))
print("beta_hat:",b)
print("EE clásicos:",se,"; EE HC1:",robust)
print("IC 95% asintótico pendiente (clásico):",b[1]+np.array([-1,1])*1.96*se[1])
print("IC 95% asintótico pendiente (HC1):",b[1]+np.array([-1,1])*1.96*robust[1])
print("Aquí E[u|x]=0: heterocedasticidad no genera sesgo de MCO.")
fig,axes=plt.subplots(1,2,figsize=(9,4))
axes[0].scatter(x,r,s=12,alpha=.4);axes[0].axhline(0,color="black")
axes[0].set(xlabel="x",ylabel="Residuo",title="Dispersión variable")
axes[1].errorbar([0,1],[b[1],b[1]],yerr=1.96*np.array([se[1],robust[1]]),fmt="o",capsize=6)
axes[1].axhline(beta1,color="#e85d3f",label="Verdad")
axes[1].set(xticks=[0,1],xticklabels=["Clásico","HC1"],ylabel="Pendiente e IC 95%",title="Mismo beta, distinta incertidumbre")
axes[1].legend();fig.tight_layout()`
  },
  {
    id: "ic-asintotica", title: "10 Clase 1· Consistencia y normalidad",
    description: "Diapositivas 68–79. Cambia delta: con delta=0 hay exogeneidad; si delta≠0, el estimador se concentra en un valor incorrecto. Se usan errores no normales y muchas muestras.",
    code: String.raw`import numpy as np
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
beta1, delta, B, epsilon = 2.0, 0.0, 1000, 0.15 # coeficiente, relación entre x y el error, simulaciones y Margen de error usado para medir qué tan frecuentemente \(\hat\beta_1\) está lejos del valor verdadero.
tamanos = [30, 100, 500, 1500]  # Cambias el tamaño de cada muestra simulada; evita muestras enormes en el navegador
if B<2 or epsilon<=0 or min(tamanos)<3: raise ValueError("Usa B>=2, epsilon>0, n>=3.")
fig,axes=plt.subplots(1,2,figsize=(10,4))
for n in tamanos:
    x=rng.normal(size=(B,n))
    # Ruido asimétrico, independiente de x, de media cero y varianza 1
    ruido=rng.exponential(size=(B,n))-1
    u=delta*x+ruido
    y=1+beta1*x+u
    xc=x-x.mean(axis=1,keepdims=True)
    b=(xc*y).sum(axis=1)/(xc**2).sum(axis=1)
    print(f"n={n:4d}: media={b.mean():.4f}, SD={b.std(ddof=1):.4f}, P(|b-beta|>{epsilon})={np.mean(abs(b-beta1)>epsilon):.3f}")
    axes[0].hist(b,bins=35,density=True,histtype="step",label=f"n={n}")
    if n==tamanos[-1]:
        z=np.sqrt(n)*(b-(beta1+delta))
        axes[1].hist(z,bins=35,density=True,alpha=.65,label="Simulación")
limite=beta1+delta
print(f"Límite teórico = beta1 + Cov(x,u)/Var(x) = {limite:.3f}")
print("Panel derecho centrado en el límite; normalidad no implica ausencia de sesgo.")
axes[0].axvline(beta1,color="black",label="Beta verdadero")
if delta!=0: axes[0].axvline(limite,color="#e85d3f",ls="--",label="Límite sesgado")
axes[0].set(xlabel="beta1_hat",ylabel="Densidad",title="Distribuciones al aumentar n")
xx=np.linspace(-4,4,250)
axes[1].plot(xx,np.exp(-xx**2/2)/np.sqrt(2*np.pi),color="#e85d3f",label="N(0,1)")
axes[1].set(xlabel="sqrt(n) × (beta_hat - límite)",ylabel="Densidad",title="Normalidad asintótica, Var(x)=Var(ruido)=1")
for ax in axes: ax.legend(fontsize=8)
fig.tight_layout()
print("\nConclusión:")

if delta == 0:
    print(
        "Al aumentar el tamaño muestral, beta_hat se concentra "
        f"alrededor del efecto verdadero beta1 = {beta1}. "
        "MCO es consistente porque x no está correlacionada con el error."
    )
else:
    print(
        "Al aumentar el tamaño muestral, beta_hat se vuelve más preciso, "
        f"pero se concentra alrededor de {limite:.3f}, no del efecto verdadero "
        f"{beta1}. Más datos reducen la variabilidad, pero no corrigen "
        "el sesgo causado por la correlación entre x y el error."
    )`
  }
];
IC_CLASS1.forEach((example) => ECON_PYTHON_EXAMPLES.push({
  ...example, course: "inferencia-causal", filename: `${example.id.replaceAll("-", "_")}.py`
}));
