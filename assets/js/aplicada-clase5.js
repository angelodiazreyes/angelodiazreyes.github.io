// Clase 5: regresión múltiple. Cada código mostrado es independiente y editable.
const A5_IMPORTS=String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
np.set_printoptions(precision=5,suppress=True)
`;
const A5_MCO=String.raw`
def mco(X,y):
    X,y=np.asarray(X,dtype=float),np.asarray(y,dtype=float)
    if X.ndim!=2 or y.shape!=(len(X),) or not np.all(np.isfinite(X)) or not np.all(np.isfinite(y)):
        raise ValueError("X debe ser matriz e y vector finito con las mismas filas.")
    n,p=X.shape
    if n<=p or np.linalg.matrix_rank(X)<p: raise ValueError("Necesitas n>parámetros y columnas sin colinealidad perfecta.")
    b=np.linalg.lstsq(X,y,rcond=None)[0];pred=X@b;res=y-pred
    s2=(res@res)/(n-p);V=s2*np.linalg.solve(X.T@X,np.eye(p))
    sct=np.sum((y-y.mean())**2);r2=1-(res@res)/sct if sct>0 else np.nan
    return b,pred,res,s2,V,r2
`;
const A5_LABS=[
{
id:"a5-matrices",title:"01 Clase 5 · Matrices: consumo de calefacción paso a paso",
description:"Slides 6–12. Usa las 15 familias de la tabla. Modifica temperatura, aislamiento o consumo; observa cómo cambian X, X'X, X'y y los coeficientes.",
code:A5_IMPORTS+A5_MCO+String.raw`temperatura=np.array([40,27,40,73,64,34,9,8,23,63,65,41,21,38,58.])
aislamiento=np.array([3,3,10,6,6,6,6,10,10,3,10,6,3,3,10.])
y=np.array([275.3,363.8,164.3,40.8,94.3,230.9,366.7,300.6,237.8,121.4,31.4,203.5,441.1,323.,52.5])
if not temperatura.shape==aislamiento.shape==y.shape: raise ValueError("Una temperatura y aislamiento por cada consumo.")
X=np.column_stack([np.ones(len(y)),temperatura,aislamiento])
b,pred,res,s2,V,r2=mco(X,y)
print("Columnas X: constante, temperatura (°F), aislamiento (pulgadas).\nX=\n",X)
print("y=",y,"\nX'X=\n",X.T@X,"\nX'y=",X.T@y)
print("(X'X)^(-1), sin redondear a dos decimales:\n",np.linalg.solve(X.T@X,np.eye(3)))
print("Beta por lstsq:",b,"; por ecuaciones normales:",np.linalg.solve(X.T@X,X.T@y))
print(pd.DataFrame({"consumo":y,"ajustado":pred,"residuo":res}).round(3).to_string(index=False))
print(f"R²={r2:.4f}; consumo esperado cambia {b[1]:.3f} galones por °F, con aislamiento fijo.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(y,pred);g=np.array([min(y.min(),pred.min()),max(y.max(),pred.max())]);ax[0].plot(g,g,"--",color="black")
ax[0].set(xlabel="Consumo observado (galones)",ylabel="Consumo ajustado",title="Acierto perfecto: diagonal")
t=np.linspace(temperatura.min(),temperatura.max(),100)
for a in [3,6,10]: ax[1].plot(t,b[0]+b[1]*t+b[2]*a,label=f"Aislamiento={a} pulgadas")
ax[1].set(xlabel="Temperatura (°F)",ylabel="Consumo ajustado (galones)",title="Cambiar temperatura, fijando aislamiento");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: cada fila es una familia y cada columna un factor. MCO usa toda la matriz para separar asociaciones parciales. Una inversa muy redondeada no reproduce bien los coeficientes: calculamos con precisión completa. La recta resume estos datos; no demuestra causalidad y puede dar predicciones poco plausibles fuera de su rango.")`
},
{
id:"a5-parcial",title:"02 Clase 5 · Mantener lo demás constante: de la recta al plano",
description:"Slides 2–5 y 13–15. Datos simulados con dos regresores relacionados. Cambia beta1, beta2 y rho; compara mover x1 solo con mover ambos regresores.",
code:A5_IMPORTS+A5_MCO+String.raw`n,beta1,beta2,rho,sigma=400,2.0,3.0,.7,1.0
if not isinstance(n,int) or not 20<=n<=3000 or abs(rho)>=1 or sigma<=0: raise ValueError("Usa 20<=n<=3000, |rho|<1, sigma>0.")
x1=rng.normal(size=n);x2=rho*x1+np.sqrt(1-rho**2)*rng.normal(size=n)
y=1+beta1*x1+beta2*x2+rng.normal(0,sigma,n)
X=np.column_stack([np.ones(n),x1,x2]);b,pred,res,s2,V,r2=mco(X,y)
dx1,dx2=1.0,1.0  # Cambios propuestos
print("Verdad [constante,beta1,beta2]:",[1,beta1,beta2],"; estimación:",b)
print(f"Solo cambia x1: Δy_hat={b[1]*dx1:.3f}; cambian ambos: Δy_hat={b[1]*dx1+b[2]*dx2:.3f}")
fig=plt.figure(figsize=(11,4.5));ax=fig.add_subplot(121,projection="3d");otro=fig.add_subplot(122)
g=np.linspace(-2,2,15);G,H=np.meshgrid(g,g)
ax.scatter(x1,x2,y,s=12,alpha=.5,color="C0");ax.plot_surface(G,H,b[0]+b[1]*G+b[2]*H,alpha=.2,color="C1")
ax.set(xlabel="x1",ylabel="x2",zlabel="y",title="MCO ajusta un plano")
for fijo in [-1,0,1]: otro.plot(g,b[0]+b[1]*g+b[2]*fijo,label=f"x2 fijo={fijo}")
otro.set(xlabel="x1",ylabel="y ajustada",title="Cortes del plano: misma pendiente parcial");otro.legend();fig.tight_layout()
print("Conclusión: beta1 compara cambios en x1 al mismo nivel de x2. Si ambas variables cambian, debemos sumar sus contribuciones. Aquí conocemos el modelo porque lo simulamos; en datos observacionales, incluir controles no garantiza que el error sea exógeno ni que la asociación sea causal.")`
},
{
id:"a5-wage",title:"03 Clase 5 · Datos reales: salarios, educación y experiencia",dataset:"wage1",
description:"Slides 35–36 y 44–50. Reproduce la regresión de wage1 con 526 trabajadores; añade tenure a regresores y compara. Los SE mostrados son clásicos, sujetos a homocedasticidad.",
code:A5_IMPORTS+A5_MCO+String.raw`regresores=["educ","exper"]  # Puedes añadir "tenure"
if not regresores or len(set(regresores))!=len(regresores) or "lwage" in regresores: raise ValueError("Usa regresores distintos y no incluyas la dependiente.")
d=pd.read_csv("wage1.csv")[["lwage"]+regresores].dropna()
y=d.lwage.to_numpy();X=np.column_stack([np.ones(len(d)),d[regresores].to_numpy()])
b,pred,res,s2,V,r2=mco(X,y);se=np.sqrt(np.diag(V))
print("wage1: datos históricos de salarios por hora, dólares de 1976. No son datos actuales de Chile.")
print(pd.DataFrame({"coeficiente":b,"SE clásico":se,"t para cero":b/se},index=["constante"]+regresores).round(6))
print(f"n={len(d)}; parámetros={X.shape[1]}; grados de libertad={len(d)-X.shape[1]}; R²={r2:.5f}; SER={np.sqrt(s2):.5f}")
print(d.head(10).assign(ajustado=pred[:10],residuo=res[:10]).round(5).to_string(index=False))
print("X'residuo:",X.T@res)
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(pred,y,s=10,alpha=.3);g=np.array([min(pred.min(),y.min()),max(pred.max(),y.max())]);ax[0].plot(g,g,"--",color="black")
ax[0].set(xlabel="Log-salario ajustado",ylabel="Log-salario observado",title="Promedios ajustados, no salarios exactos")
ax[1].scatter(pred,res,s=10,alpha=.3);ax[1].axhline(0,color="black",ls="--")
ax[1].set(xlabel="Log-salario ajustado",ylabel="Residuo",title="Lo que el modelo no explica");fig.tight_layout()
print("Conclusión: la regresión múltiple compara educación manteniendo experiencia fija, y viceversa. Un coeficiente b en log-salario equivale aproximadamente a 100*b por ciento por unidad, no a dólares. Agregar tenure cambia qué mantenemos fijo. Los residuos no desaparecen y controlar estas variables no basta para demostrar causalidad.")`
},
{
id:"a5-cambios",title:"04 Clase 5 · Cambios simultáneos, logaritmos y elasticidades",
description:"Slides 16 y 19. Calculadora con los coeficientes reportados, no una estimación nueva. Elige escenario='salario' o 'gasto' para comparar cambios exactos y aproximados.",
code:A5_IMPORTS+String.raw`escenario="salario"
delta_educ,delta_exper,delta_tenure=0.0,1.0,1.0
cambio_renta_pct,delta_adultos,delta_hijos=10.0,0.0,1.0
if escenario not in ["salario","gasto"] or cambio_renta_pct<=-100: raise ValueError("Elige salario/gasto y un cambio de renta mayor que -100%.")
if escenario=="salario":
    nombres=["Educación","Experiencia","Antigüedad"]
    partes=np.array([.092*delta_educ,.0041*delta_exper,.022*delta_tenure])
else:
    nombres=["Log-renta","Adultos","Hijos"]
    partes=np.array([.49*np.log1p(cambio_renta_pct/100),.042*delta_adultos,.088*delta_hijos])
cambio_log=partes.sum();exacto=100*np.expm1(cambio_log);aprox=100*cambio_log
print("Escenario:",escenario,"; contribuciones al cambio log:",dict(zip(nombres,partes)))
print(f"Δlog(y)={cambio_log:.6f}; cambio exponenciado exacto={exacto:.4f}%; aproximación={aprox:.4f}%")
if escenario=="gasto": print("Elasticidad-renta=0.49: para cambios pequeños, 1% más de renta se asocia con 0.49% más de gasto, ceteris paribus.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].bar(nombres,100*partes);ax[0].axhline(0,color="gray");ax[0].set(ylabel="100 × contribución a Δlog(y)",title="Los cambios se suman en logaritmos")
f=np.linspace(0,2,100);ax[1].plot(f,100*np.expm1(f*cambio_log),label="Exacto exponenciado");ax[1].plot(f,100*f*cambio_log,"--",label="Aproximación")
ax[1].scatter([1],[exacto]);ax[1].set(xlabel="Multiplicador del cambio total en log",ylabel="Cambio porcentual",title="Diferencias al ampliar el cambio");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: un año más en la misma empresa aumenta experiencia y antigüedad: no debemos contar solo uno de sus coeficientes. Los cambios se suman en log(y), pero sus porcentajes exactos no son aditivos. Exponenciar el log ajustado no da automáticamente E(y|X): describe una escala geométrica; sería la mediana bajo error log de mediana cero. Son asociaciones del modelo, no efectos causales garantizados.")`
},
{
id:"a5-unidades",title:"05 Clase 5 · Unidades: coeficientes y errores estándar cambian juntos",
description:"Slides 17–18 y 67. Simula salarios de CEO. Cambia cy para la unidad del salario y cx para la del rendimiento; observa que t para cero y R² se conservan.",
code:A5_IMPORTS+A5_MCO+String.raw`n,cy,cx=300,10.0,.01
if not isinstance(n,int) or not 20<=n<=5000 or cy<=0 or cx<=0: raise ValueError("Usa 20<=n<=5000 y factores de escala positivos.")
roe=rng.uniform(0,30,n);ventas=rng.uniform(100,20000,n)
y=830.63+19.63*roe+.016*ventas+rng.normal(0,250,n)
X=np.column_stack([np.ones(n),roe,ventas]);b,pred,res,s2,V,r2=mco(X,y)
X2=np.column_stack([np.ones(n),cx*roe,ventas]);b2,p2,r2res,s22,V2,r22=mco(X2,cy*y)
factores=np.array([cy,cy/cx,cy]);se=np.sqrt(np.diag(V));se2=np.sqrt(np.diag(V2))
print(pd.DataFrame({"b original":b,"b nueva":b2,"factor esperado":factores,"SE original":se,"SE nuevo":se2,"t original":b/se,"t nuevo":b2/se2},index=["constante","roe","ventas"]).round(5))
print(f"R² original={r2:.6f}; nuevo={r22:.6f}; diferencia máxima de predicciones en unidad original={np.max(abs(p2/cy-pred)):.2e}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(y,pred,s=10,alpha=.3);ax[0].set(xlabel="Salario original (miles de dólares)",ylabel="Ajustado",title="Modelo original")
ax[1].scatter(cy*y,p2,s=10,alpha=.3);ax[1].set(xlabel="Salario en nueva unidad",ylabel="Ajustado",title="Misma relación, distinta escala");fig.tight_layout()
print("Conclusión: un coeficiente más grande por cambiar unidades no significa un efecto económico mayor. Coeficientes y SE se transforman juntos, de modo que la prueba contra cero no cambia. Con cy=10 pasamos de miles a cientos de dólares; con cx=.01, de porcentaje a proporción. Para contrastar otra hipótesis, también hay que transformar su valor nulo.")`
},
{
id:"a5-cuadratica",title:"06 Clase 5 · Experiencia al cuadrado: un efecto que cambia",
description:"Slides 4 y 20–21. Modelo simulado log(wage)=0.128+0.090*educ+0.041*exper−0.00071*exper²+u. Cambia la curvatura y compara derivada con el cambio de un año completo.",
code:A5_IMPORTS+A5_MCO+String.raw`n,b_exp,b_cuad,sigma=800,.041,-.00071,.25
educ_fija,exper0,dx=12.0,20.0,1.0
if not isinstance(n,int) or not 30<=n<=5000 or sigma<=0 or not 0<=exper0<=50 or not 0<=exper0+dx<=50: raise ValueError("Revisa n, sigma y experiencia entre 0 y 50.")
educ=rng.uniform(8,18,n);exper=rng.uniform(0,50,n)
y=.128+.090*educ+b_exp*exper+b_cuad*exper**2+rng.normal(0,sigma,n)
X=np.column_stack([np.ones(n),educ,exper,exper**2]);b,pred,res,s2,V,r2=mco(X,y)
marginal=b[2]+2*b[3]*exper0
delta_log=b[2]*dx+b[3]*((exper0+dx)**2-exper0**2)
print("Coeficientes [constante,educ,exper,exper²]:",b)
print(f"En exper={exper0}: derivada={marginal:.6f}; Δlog para {dx:g} años={delta_log:.6f}")
print(f"Aproximación local={100*marginal*dx:.4f}%; cambio exponenciado exacto={100*np.expm1(delta_log):.4f}%")
if abs(b[3])>1e-12:
    giro=-b[2]/(2*b[3]);print(f"Punto de giro estimado={giro:.2f} años; dentro de 0–50: {0<=giro<=50}; {'máximo' if b[3]<0 else 'mínimo'}.")
g=np.linspace(0,50,200);fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].plot(g,b[0]+b[1]*educ_fija+b[2]*g+b[3]*g**2,label="Curva ajustada")
ax[0].plot(g,.128+.090*educ_fija+b_exp*g+b_cuad*g**2,"--",label="Curva verdadera")
ax[0].set(xlabel="Experiencia",ylabel="Log-salario medio",title=f"Educación fija en {educ_fija:g}");ax[0].legend(fontsize=8)
ax[1].plot(g,100*(b[2]+2*b[3]*g));ax[1].axhline(0,color="black",ls="--");ax[1].scatter([exper0],[100*marginal])
ax[1].set(xlabel="Experiencia",ylabel="100 × derivada del log-salario",title="Cambio porcentual local aproximado");fig.tight_layout()
print("Conclusión: al cambiar experiencia también cambia su cuadrado. Por eso su efecto no es solo b_exper: depende del punto de partida. La derivada aproxima cambios pequeños; para un año completo calculamos ambas potencias. El modelo sigue siendo lineal en los coeficientes y una extrapolación más allá de los datos puede ser engañosa.")`
},
{
id:"a5-algebra",title:"07 Clase 5 · Residuos, medias y R²: comprobar las propiedades",
description:"Slides 22–34 y 37–41. Usa las cuatro observaciones de las slides. Modifica y o quita el intercepto para ver cuáles propiedades dependen de incluirlo.",
code:A5_IMPORTS+A5_MCO+String.raw`x1=np.array([0,1,0,1.]);x2=np.array([0,0,1,1.]);y=np.array([1,2,3,6.])
intercepto=True
X=np.column_stack([np.ones(4),x1,x2]) if intercepto else np.column_stack([x1,x2])
b,pred,res,s2,V,r2=mco(X,y)
sct=np.sum((y-y.mean())**2);sce=np.sum((pred-y.mean())**2);scr=res@res;cruzado=2*(pred-y.mean())@res
print(pd.DataFrame({"x1":x1,"x2":x2,"y":y,"ajustado":pred,"residuo":res}).to_string(index=False))
print("Beta:",b,"; suma residuos:",res.sum(),"; X'residuo:",X.T@res)
print("Media y:",y.mean(),"; media ajustada:",pred.mean(),"; predicción en medias:",X.mean(axis=0)@b)
print("Ajustado'residuo:",pred@res)
print(f"SCT={sct:.3f}; SCE={sce:.3f}; SCR={scr:.3f}; término cruzado={cruzado:.3f}; R² centrado={r2:.4f}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));j=np.arange(len(y))
ax[0].scatter(j,y,label="Observado");ax[0].scatter(j,pred,label="Ajustado");ax[0].vlines(j,pred,y,color="gray")
ax[0].set(xticks=j,xticklabels=j+1,xlabel="Observación",ylabel="y",title="Distancias verticales = residuos");ax[0].legend()
ax[1].bar(["SCT","SCE","SCR","Cruzado"],[sct,sce,scr,cruzado]);ax[1].axhline(0,color="gray")
ax[1].set(ylabel="Suma de cuadrados / término cruzado",title="SCT = SCE + SCR + término cruzado");fig.tight_layout()
print("Conclusión: con intercepto, MCO equilibra los residuos, reproduce la media y elimina el término cruzado: en el ejemplo original R²=13/14. Sin intercepto, X'residuo sigue siendo cero, pero la suma de residuos y la descomposición centrada no están garantizadas; R² centrado puede incluso ser negativo. Son propiedades del ajuste, no pruebas de causalidad o exogeneidad.")`
},
{
id:"a5-r2",title:"08 Clase 5 · Más variables: mejor R² no siempre predice mejor",
description:"Slides 37–41 y 58; extensión: R² ajustado y evaluación en datos nuevos. Añade regresores irrelevantes a la misma muestra, manteniendo y fija.",
code:A5_IMPORTS+A5_MCO+String.raw`n,kmax,n_prueba,sigma=80,20,3000,2.0
if not all(isinstance(v,int) for v in [n,kmax,n_prueba]) or not 20<=n<=1000 or not 1<=kmax<min(n-2,50) or not 100<=n_prueba<=10000 or sigma<=0:
    raise ValueError("Usa 20<=n<=1000, 1<=kmax<min(n-2,50), 100<=n_prueba<=10000, sigma>0.")
Z=rng.normal(size=(n,kmax));Ztest=rng.normal(size=(n_prueba,kmax))
y=1+2*Z[:,0]+rng.normal(0,sigma,n);ytest=1+2*Ztest[:,0]+rng.normal(0,sigma,n_prueba)
r2s=[];ajustados=[];entrenamiento=[];prueba=[]
for k in range(1,kmax+1):
    X=np.column_stack([np.ones(n),Z[:,:k]]);Xt=np.column_stack([np.ones(n_prueba),Ztest[:,:k]])
    b,pred,res,s2,V,r2=mco(X,y);ra=1-(1-r2)*(n-1)/(n-k-1)
    r2s.append(r2);ajustados.append(ra);entrenamiento.append(np.mean(res**2));prueba.append(np.mean((ytest-Xt@b)**2))
    print(f"k={k:2d}: R²={r2:.4f}, ajustado={ra:.4f}, ECM muestra={entrenamiento[-1]:.3f}, ECM prueba={prueba[-1]:.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));ks=np.arange(1,kmax+1)
ax[0].plot(ks,r2s,label="R²");ax[0].plot(ks,ajustados,label="R² ajustado");ax[0].set(xlabel="Regresores (solo el primero es relevante)",ylabel="Ajuste",title="Misma muestra, modelos anidados");ax[0].legend()
ax[1].plot(ks,entrenamiento,label="Muestra de estimación");ax[1].plot(ks,prueba,label="Datos nuevos")
ax[1].axhline(sigma**2,color="gray",ls="--",label="Ruido irreducible poblacional")
ax[1].set(xlabel="Regresores",ylabel="Error cuadrático medio",title="Ajustar también puede capturar ruido");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: al añadir columnas MCO puede conservar el ajuste anterior poniendo sus coeficientes en cero; por eso el R² no baja en la misma muestra. Pero memorizar ruido no mejora necesariamente las predicciones nuevas. R² ajustado penaliza parámetros, aunque tampoco garantiza el mejor modelo ni causalidad. La curva de prueba puede fluctuar; no tiene que empeorar en cada paso.")`
},
{
id:"a5-fwl",title:"09 Clase 5 · FWL: descontar linealmente los controles",dataset:"wage1",
description:"Slides 42–50. Compara MCO múltiple con residualizar educación y log-salario respecto de experiencia y antigüedad. Puedes cambiar objetivo y controles.",
code:A5_IMPORTS+A5_MCO+String.raw`objetivo="educ";controles=["exper","tenure"];dependiente="lwage"
if len(set(controles))!=len(controles) or objetivo in controles or dependiente in [objetivo]+controles: raise ValueError("Usa variables distintas, sin repetir controles.")
d=pd.read_csv("wage1.csv")[[dependiente,objetivo]+controles].dropna()
y=d[dependiente].to_numpy();x=d[objetivo].to_numpy();n=len(d)
Z=np.column_stack([np.ones(n),d[controles].to_numpy()]);X=np.column_stack([Z[:,0],x,Z[:,1:]])
b,pred,res,s2,V,r2=mco(X,y)
rx=x-Z@np.linalg.lstsq(Z,x,rcond=None)[0];ry=y-Z@np.linalg.lstsq(Z,y,rcond=None)[0]
parcial=rx@ry/(rx@rx);solo_x=rx@y/(rx@rx)
gl=n-X.shape[1];res_fwl=ry-parcial*rx;se_fwl=np.sqrt((res_fwl@res_fwl)/gl/(rx@rx))
R=np.column_stack([np.ones(n),rx]);br,pr,rr,s2r,Vr,r2r=mco(R,y)
print("wage1 histórico. n=",n,"; controles:",controles)
print(pd.DataFrame({"x":x[:8],"x residual":rx[:8],"y":y[:8],"y residual":ry[:8]}).round(5))
print(f"Pendiente múltiple={b[1]:.8f}; rx contra ry={parcial:.8f}; rx contra y={solo_x:.8f}")
print(f"SE clásico múltiple={np.sqrt(V[1,1]):.8f}; FWL con gl={gl}: {se_fwl:.8f}")
print(f"SE ingenuo de y sobre rx con n-2 gl={np.sqrt(Vr[1,1]):.8f}; no es necesariamente el SE múltiple.")
print("Mayor diferencia de residuos completos y FWL:",np.max(abs(res-res_fwl)))
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(x,y,s=8,alpha=.25);ax[0].set(xlabel=objetivo,ylabel=dependiente,title="Relación sin descontar controles")
ax[1].scatter(rx,ry,s=8,alpha=.25);g=np.linspace(rx.min(),rx.max(),100);ax[1].plot(g,parcial*g,color="C1")
ax[1].set(xlabel=objetivo+": residuo tras controles",ylabel=dependiente+": residuo tras controles",title="Misma pendiente que MCO múltiple");fig.tight_layout()
print("Conclusión: residualizar significa restar una predicción LINEAL basada en los controles. La pendiente usa lo que queda de x, no su variación compartida con ellos. Residualizar solo x conserva la pendiente, pero no automáticamente los SE ni el R²; para recuperar el SE clásico completo usamos los residuos completos y sus grados de libertad. Controlar estas variables no demuestra causalidad.")`
},
{
id:"a5-identidad",title:"10 Clase 5 · Regresión simple y múltiple: explicar su diferencia",dataset:"wage1",
description:"Slides 51–53. Verifica exactamente la identidad b_simple=b_x_múltiple+b_z_múltiple*delta usando la misma muestra de wage1. Prueba ortogonalizar el control.",
code:A5_IMPORTS+A5_MCO+String.raw`variable_x="educ";variable_z="exper";ortogonalizar=False
if variable_x==variable_z or "lwage" in [variable_x,variable_z]: raise ValueError("Usa dos regresores distintos de lwage.")
d=pd.read_csv("wage1.csv")[["lwage",variable_x,variable_z]].dropna()
y=d.lwage.to_numpy();x=d[variable_x].to_numpy();z=d[variable_z].to_numpy();n=len(d)
Xs=np.column_stack([np.ones(n),x])
if ortogonalizar: z=z-Xs@np.linalg.lstsq(Xs,z,rcond=None)[0]
b_aux=np.linalg.lstsq(Xs,z,rcond=None)[0];delta=b_aux[1]
bs,ps,rs,_,_,_=mco(Xs,y);X=np.column_stack([np.ones(n),x,z]);bm,pm,rm,_,_,_=mco(X,y)
componente=bm[2]*delta
print(f"Misma muestra n={n}. X={variable_x}; Z={variable_z}; Z residualizada={ortogonalizar}")
print(f"Simple={bs[1]:.8f}; múltiple={bm[1]:.8f}; efecto parcial de Z={bm[2]:.8f}; delta de Z sobre X={delta:.8f}")
print(f"Diferencia={bs[1]-bm[1]:.8f}; producto b_z*delta={componente:.8f}; error de identidad={bs[1]-bm[1]-componente:.2e}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(x,z,s=8,alpha=.25);g=np.linspace(x.min(),x.max(),100);ax[0].plot(g,b_aux[0]+delta*g,color="C1")
ax[0].set(xlabel=variable_x,ylabel=variable_z+ (" residualizada" if ortogonalizar else ""),title="¿Cómo se relacionan los regresores?")
ax[1].bar(["Múltiple","Componente\nb_z × delta","Simple"],[bm[1],componente,bs[1]]);ax[1].axhline(0,color="gray")
ax[1].set(ylabel="Coeficiente de X / contribución",title="Primera barra + segunda = tercera");fig.tight_layout()
print("Conclusión: la regresión simple mezcla la asociación parcial de x con la contribución del control que se mueve con x. La identidad es algebraica en esta muestra; llamarla sesgo causal requiere supuestos poblacionales adicionales. Si ortogonalizamos z respecto de x, delta queda en cero y ambas pendientes coinciden: cambiamos la definición del control, no fabricamos evidencia causal.")`
},
{
id:"a5-omitida",title:"11 Clase 5 · Variable omitida: los cuatro signos del sesgo",
description:"Slides 54–60. Simula un modelo con x y z, pero compara omitir e incluir z. Cambia gamma, rho_abs, n y B para explorar el signo y el tamaño del sesgo.",
code:A5_IMPORTS+String.raw`n,B,beta,gamma,rho_abs=200,1500,2.0,1.5,.7
if not isinstance(n,int) or not isinstance(B,int) or n<20 or B<100 or n*B>2000000 or gamma<0 or not 0<=rho_abs<.99:
    raise ValueError("Usa n>=20, B>=100 enteros, n*B<=2 millones, gamma>=0 y 0<=rho_abs<.99.")
x,v,e=rng.normal(size=(3,B,n));xc=x-x.mean(axis=1,keepdims=True);Sxx=np.sum(xc**2,axis=1)
fig,ax=plt.subplots(2,2,figsize=(11,7));resultados=[]
for eje,(sg,sr) in zip(ax.flat,[(1,1),(1,-1),(-1,1),(-1,-1)]):
    efecto=sg*gamma;rho=sr*rho_abs;z=rho*x+np.sqrt(1-rho**2)*v
    y=1+beta*x+efecto*z+e;zc=z-z.mean(axis=1,keepdims=True);yc=y-y.mean(axis=1,keepdims=True)
    Szz=np.sum(zc**2,axis=1);Sxz=np.sum(xc*zc,axis=1);Sxy=np.sum(xc*yc,axis=1);Szy=np.sum(zc*yc,axis=1)
    corta=Sxy/Sxx;larga=(Sxy*Szz-Szy*Sxz)/(Sxx*Szz-Sxz**2);sesgo=efecto*rho
    resultados.append((corta,larga,sesgo))
    print(f"gamma={efecto:+.2f}, rho={rho:+.2f}: sesgo teórico={sesgo:+.3f}; media corta={corta.mean():.3f}; media completa={larga.mean():.3f}")
    print(f"  Error Monte Carlo de medias: corta={corta.std(ddof=1)/np.sqrt(B):.4f}; completa={larga.std(ddof=1)/np.sqrt(B):.4f}")
    eje.hist(corta,bins=35,density=True,histtype="step",label="Omite z");eje.hist(larga,bins=35,density=True,histtype="step",label="Incluye z")
    eje.axvline(beta,color="black",ls="--",label="Beta verdadero");eje.axvline(beta+sesgo,color="C3",ls=":",label="Centro al omitir")
    eje.set(xlabel="Pendiente de x",ylabel="Densidad",title=f"gamma={efecto:+.1f}, rho={rho:+.1f}");eje.legend(fontsize=7)
fig.tight_layout()
print("Conclusión: el signo del sesgo combina dos conexiones: cuánto influye z en y y cómo se relaciona z con x. Signos iguales desplazan a la derecha; distintos, a la izquierda. Aquí Var(x)=Var(z)=1 y E(z|x)=rho*x, por lo que el sesgo poblacional es gamma*rho. Si cualquiera vale cero, este sesgo desaparece. Más datos concentran el modelo corto en su centro incorrecto; observar z permite corregirlo en este modelo simulado.")`
},
{
id:"a5-forma",title:"12 Clase 5 · Forma funcional omitida: residuos con una curva",
description:"Slides 5, 34 y 56. La media verdadera incluye x². Compara excluirlo e incluirlo, y observa un patrón no lineal que una correlación lineal de residuos no detecta.",
code:A5_IMPORTS+A5_MCO+String.raw`n,curvatura,sigma=800,1.0,1.0
if not isinstance(n,int) or not 50<=n<=5000 or sigma<=0: raise ValueError("Usa 50<=n<=5000 y sigma>0.")
x=rng.uniform(0,4,n);z=rng.normal(size=n);y=1+2*x+curvatura*x**2+z+rng.normal(0,sigma,n)
Xs=np.column_stack([np.ones(n),x,z]);Xc=np.column_stack([Xs,x**2])
bs,ps,rs,_,_,_=mco(Xs,y);bc,pc,rc,_,_,_=mco(Xc,y)
print("Verdad [constante,x,z,x²]:",[1,2,1,curvatura],"; completo:",bc)
print("Sin cuadrado [constante,x,z]:",bs,"; X'residuo:",Xs.T@rs)
print("Con cuadrado: X'residuo:",Xc.T@rc)
fig,ax=plt.subplots(1,2,figsize=(10,4.5));bloques=np.array_split(np.argsort(x),10)
for eje,r,nombre in zip(ax,[rs,rc],["Omite x²","Incluye x²"]):
    eje.scatter(x,r,s=7,alpha=.15);eje.plot([x[g].mean() for g in bloques],[r[g].mean() for g in bloques],"o-",color="C1",label="Residuo medio por tramo")
    eje.axhline(0,color="black",ls="--");eje.set(xlabel="x",ylabel="Residuo",title=nombre);eje.legend(fontsize=8)
fig.tight_layout()
print("Conclusión: una recta puede dejar una curva sistemática en los residuos aunque su correlación lineal con x sea cero. Eso ocurre por construcción de MCO, no porque la media condicional esté bien modelada. En este diseño x es positivo y omitir x² también altera la pendiente de x; no toda mala especificación sesga todos los coeficientes en cualquier población. Con curvatura=0, el modelo corto ya contiene la media correcta.")`
},
{
id:"a5-rango",title:"13 Clase 5 · Colinealidad perfecta: coeficientes que no son únicos",
description:"Slides 54–55. Construye x2=3+2*x1. Cambia ruido_x2 de cero a un valor pequeño para distinguir falta de identificación de inestabilidad.",
code:A5_IMPORTS+String.raw`n,ruido_x2,desplazamiento=100,0.0,5.0
if not isinstance(n,int) or not 10<=n<=3000 or ruido_x2<0: raise ValueError("Usa 10<=n<=3000 y ruido_x2>=0.")
x1=np.linspace(-2,2,n);x2=3+2*x1+ruido_x2*rng.normal(size=n)
X=np.column_stack([np.ones(n),x1,x2]);y=1+2*x1+4*x2+rng.normal(size=n)
b=np.linalg.lstsq(X,y,rcond=None)[0];rango=np.linalg.matrix_rank(X)
direccion=np.array([-3.,-2.,1.]);alternativa=b+desplazamiento*direccion
print(f"Rango X={rango}; columnas=3; número de condición={np.linalg.cond(X):.3g}")
print("Una solución de mínimos cuadrados:",b,"; otro vector candidato:",alternativa)
print("Mayor diferencia de predicciones:",np.max(abs(X@b-X@alternativa)))
print("SRC primera:",np.sum((y-X@b)**2),"; segunda:",np.sum((y-X@alternativa)**2))
if rango<3: print("No hay coeficientes únicos: lstsq devuelve una solución de norma mínima, no identifica los tres efectos por separado.")
else: print("Hay rango completo: los coeficientes son únicos; si ruido_x2 es muy pequeño, la separación es frágil.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(x1,x2,s=12);ax[0].set(xlabel="x1",ylabel="x2",title="¿Existe una relación lineal exacta?")
ax[1].plot(x1,X@b,label="Solución MCO");ax[1].plot(x1,X@alternativa,"--",label="Vector alternativo")
ax[1].set(xlabel="x1",ylabel="Predicción",title="Con ruido=0 las predicciones coinciden");ax[1].legend();fig.tight_layout()
print("Conclusión: si x2 siempre equivale a 3+2*x1, los datos no permiten variar un regresor manteniendo el otro fijo. Podemos trasladar coeficientes entre columnas sin cambiar ninguna predicción. Una pseudoinversa no crea la información que falta. Un poco de variación independiente elimina la igualdad exacta, pero puede dejar mucha incertidumbre.")`
},
{
id:"a5-vif",title:"14 Clase 5 · Variable irrelevante, multicolinealidad y VIF",
description:"Slides 58 y 61–64. El control z no afecta y. Al correlacionarlo con x, MCO sigue centrado en beta pero pierde precisión. Compara SD simulada con sigma/raíz(Sxx*(1−Rj²)).",
code:A5_IMPORTS+String.raw`n,B,beta,sigma=150,2000,2.0,1.0
rhos=[0.0,.5,.9,.99,1.0]
if not isinstance(n,int) or not isinstance(B,int) or n<10 or B<100 or n*B>2000000 or sigma<=0 or not rhos or any(abs(r)>1 for r in rhos):
    raise ValueError("Usa n>=10, B>=100 enteros, n*B<=2 millones, sigma>0 y |rho|<=1.")
x=rng.normal(size=n);x=(x-x.mean())/x.std(ddof=0)
v=rng.normal(size=n);v=v-v.mean()-x*(x@v)/(x@x);v=v/v.std(ddof=0)
Sxx=x@x;u=rng.normal(0,sigma,(B,n));y=1+beta*x+u
corta=y@x/Sxx;estimaciones=[];etiquetas=[];teoricas=[]
for rho in rhos:
    z=rho*x+np.sqrt(1-rho**2)*v;X=np.column_stack([np.ones(n),x,z])
    if np.linalg.matrix_rank(X)<3: print(f"rho={rho}: colinealidad perfecta; sin pendiente individual identificada.");continue
    rx=x-np.column_stack([np.ones(n),z])@np.linalg.lstsq(np.column_stack([np.ones(n),z]),x,rcond=None)[0]
    b=y@rx/(rx@rx);Rj2=1-(rx@rx)/Sxx;vif=1/(1-Rj2);sd_real=sigma/np.sqrt(Sxx*(1-Rj2))
    estimaciones.append(b);etiquetas.append(str(rho));teoricas.append(sd_real)
    print(f"rho={rho}: Rj²={Rj2:.4f}; VIF={vif:.3f}; media={b.mean():.4f}; SD={b.std(ddof=1):.4f}; SD teórica={sd_real:.4f}")
print(f"Sin control: media={corta.mean():.4f}; SD={corta.std(ddof=1):.4f}; teoría={sigma/np.sqrt(Sxx):.4f}")
if not estimaciones: raise ValueError("Incluye al menos un |rho|<1 para comparar distribuciones.")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));j=np.arange(len(estimaciones))
ax[0].boxplot(estimaciones,showfliers=False);ax[0].set_xticks(j+1,etiquetas);ax[0].axhline(beta,color="black",ls="--")
ax[0].set(xlabel="Correlación muestral x,z",ylabel="Pendiente estimada",title="Mismo centro, distinta dispersión")
ax[1].plot(j,[b.std(ddof=1) for b in estimaciones],"o-",label="SD simulada");ax[1].plot(j,teoricas,"s--",label="SD teórica")
ax[1].axhline(sigma/np.sqrt(Sxx),color="gray",label="Sin control");ax[1].set(xticks=j,xticklabels=etiquetas,xlabel="Correlación x,z",ylabel="SD de la pendiente",title="VIF multiplica la varianza, no la SD");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: agregar una variable irrelevante no sesga el coeficiente de x bajo estos supuestos, pero puede hacerlo mucho menos preciso si está correlacionada con x. Queda menos variación propia de x para distinguir sus efectos. VIF=1/(1-Rj²) multiplica la varianza; la SD se multiplica por raíz(VIF). Correlación alta no es colinealidad perfecta, ni una regla automática para eliminar un control relevante.")`
},
{
id:"a5-varianza",title:"15 Clase 5 · Insesgadez, grados de libertad y errores estándar",
description:"Slides 57 y 65–66. Repite muestras de errores con una matriz X fija. Cambia n, k y sigma; compara SCR/n con SCR/(n−k−1), y SE con la dispersión real de los coeficientes.",
code:A5_IMPORTS+String.raw`n,k,B,sigma=40,8,2000,2.0
if not all(isinstance(v,int) for v in [n,k,B]) or n<10 or not 1<=k<min(n-2,25) or B<100 or B*n>2000000 or sigma<=0:
    raise ValueError("Usa n>=10, 1<=k<min(n-2,25), B>=100 enteros, B*n<=2 millones y sigma>0.")
Z=rng.normal(size=(n,k));X=np.column_stack([np.ones(n),Z]);p=k+1;gl=n-p
if np.linalg.matrix_rank(X)<p: raise ValueError("X debe tener rango completo.")
verdad=np.r_[1.,np.linspace(.5,1.5,k)];A=np.linalg.pinv(X)  # Rango completo; no construimos una matriz n por n.
y=(X@verdad)[None,:]+rng.normal(0,sigma,(B,n));betas=y@A.T;res=y-betas@X.T
scr=np.sum(res**2,axis=1);s2=scr/gl;inv=np.linalg.solve(X.T@X,np.eye(p));se=np.sqrt(s2[:,None]*np.diag(inv))
sd_real=sigma*np.sqrt(np.diag(inv));sd_mc=betas.std(axis=0,ddof=1)
print(f"n={n}; regresores k={k}; parámetros={p}; gl=n-k-1={gl}")
print(f"SCR/n: promedio={np.mean(scr/n):.4f}, esperanza={gl/n*sigma**2:.4f}; SCR/gl: promedio={s2.mean():.4f}, verdad={sigma**2:.4f}")
print(pd.DataFrame({"verdad":verdad,"media estimada":betas.mean(axis=0),"SD simulada":sd_mc,"SD teórica":sd_real,"SE promedio":se.mean(axis=0)}).round(4))
otros=X[:,[0]+list(range(2,p))];rx=X[:,1]-otros@np.linalg.lstsq(otros,X[:,1],rcond=None)[0]
Sxx=np.sum((X[:,1]-X[:,1].mean())**2);Rj2=1-(rx@rx)/Sxx
print(f"SE primera pendiente, primera muestra: matriz={se[0,1]:.6f}; fórmula Rj²={np.sqrt(s2[0]/(Sxx*(1-Rj2))):.6f}")
fig,ax=plt.subplots(1,2,figsize=(10,4.5));j=np.arange(p)
ax[0].bar(["SCR/n","SCR/(n-k-1)"],[np.mean(scr/n),s2.mean()]);ax[0].axhline(sigma**2,color="black",ls="--",label="Sigma² verdadera");ax[0].set(ylabel="Varianza promedio estimada",title="Ajustar parámetros consume grados libres");ax[0].legend(fontsize=8)
ax[1].plot(j,sd_mc,"o-",label="SD entre muestras");ax[1].plot(j,se.mean(axis=0),"s--",label="SE promedio")
ax[1].set(xticks=j,xlabel="Coeficiente (0 = intercepto)",ylabel="Desviación estándar",title="SE estima la incertidumbre de beta_hat");ax[1].legend(fontsize=8);fig.tight_layout()
print("Conclusión: cada coeficiente estimado usa un grado de libertad. Dividir por n-k-1 corrige en promedio la varianza residual bajo exogeneidad y homocedasticidad, sin eliminar filas. Los coeficientes fluctúan alrededor de la verdad: insesgadez no significa acertar en cada muestra. Sigma describe el ruido individual; SE describe la incertidumbre del coeficiente. La raíz de una varianza insesgada no es necesariamente insesgada.")`
},
{
id:"a5-gauss-markov",title:"16 Clase 5 · Gauss–Markov: qué significa mejor lineal insesgado",
description:"Slide 68. Compara MCO con otro estimador lineal insesgado construido con la misma X. Cambia c para añadir ruido sin cambiar el centro. Diseño fijo y errores homocedásticos.",
code:A5_IMPORTS+String.raw`n,B,sigma,c=100,3000,1.0,2.0
if not isinstance(n,int) or not isinstance(B,int) or n<10 or B<100 or n*B>2000000 or sigma<=0 or not np.isfinite(c):
    raise ValueError("Usa n>=10, B>=100 enteros, n*B<=2 millones, sigma>0 y c finito.")
x=rng.uniform(-2,2,n);z=rng.normal(size=n);X=np.column_stack([np.ones(n),x,z]);verdad=np.array([1.,2.,3.])
if np.linalg.matrix_rank(X)<3: raise ValueError("X debe tener rango completo.")
A=np.linalg.pinv(X)  # Equivale a (X'X)^(-1)X' con rango completo.
q=x**2-X@np.linalg.lstsq(X,x**2,rcond=None)[0];q=q/np.linalg.norm(q)
D=np.zeros_like(A);D[1]=c*np.linalg.norm(A[1])*q
alternativo=A+D
print("A_MCO X=\n",A@X,"\nA_alternativo X=\n",alternativo@X,"\nD X=\n",D@X)
y=(X@verdad)[None,:]+rng.normal(0,sigma,(B,n))
b_ols=y@A.T;b_alt=y@alternativo.T
var_ols=sigma**2*(A[1]@A[1]);var_alt=sigma**2*(alternativo[1]@alternativo[1])
print(f"Beta1 verdadero=2; media MCO={b_ols[:,1].mean():.4f}; media alternativo={b_alt[:,1].mean():.4f}")
print(f"Varianzas teóricas: MCO={var_ols:.6f}; alternativo={var_alt:.6f}; cociente={var_alt/var_ols:.3f}=1+c²")
print("Varianzas simuladas:",b_ols[:,1].var(ddof=1),b_alt[:,1].var(ddof=1))
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].hist(b_ols[:,1],bins=40,density=True,histtype="step",label="MCO");ax[0].hist(b_alt[:,1],bins=40,density=True,histtype="step",label="Otro lineal insesgado")
ax[0].axvline(2,color="black",ls="--");ax[0].set(xlabel="Pendiente de x estimada",ylabel="Densidad",title="El mismo objetivo, distinta precisión");ax[0].legend(fontsize=8)
ax[1].bar(["MCO","Alternativo"],[var_ols,var_alt]);ax[1].set(ylabel="Varianza condicional verdadera",title="El agregado D no aporta señal");fig.tight_layout()
print("Conclusión: ambos estimadores son combinaciones lineales de y y aciertan en promedio porque A*X=I. El alternativo añade una combinación de datos sin señal sobre beta y aumenta la varianza. Gauss–Markov dice que MCO tiene menor o igual varianza entre TODOS los lineales insesgados bajo sus supuestos; esta simulación ilustra un competidor, no demuestra el teorema. No promete ganar en cada muestra, superar estimadores sesgados ni conservar esa optimalidad bajo heteroscedasticidad.")`
}
];
A5_LABS.forEach(example=>ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",classNumber:5,filename:example.title+".py"}));
