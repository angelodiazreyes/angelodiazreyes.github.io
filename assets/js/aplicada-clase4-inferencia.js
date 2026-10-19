// Ampliación de Clase 4. Los ejercicios 01–14 permanecen intactos.
const A4T_IMPORTS = String.raw`import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import t as student, norm
rng=np.random.default_rng(123)
np.set_printoptions(precision=4,suppress=True)
`;
const A4T_LABS = [
{
id:"a4t-estadistico",title:"15 Clase 4 · Estadístico t: distancia en errores estándar",
description:"Slides 93–94 y 104–105. Cambia beta_hat, beta_nula y se. No necesitas datos individuales para calcular t a partir de estos resúmenes.",
code:A4T_IMPORTS+String.raw`beta_hat,beta_nula,se=10.0,0.0,4.0  # CAMBIA
if not np.all(np.isfinite([beta_hat,beta_nula,se])) or se<=0: raise ValueError("Usa valores finitos y SE positivo.")
t_obs=(beta_hat-beta_nula)/se
print(f"Distancia: {beta_hat}-{beta_nula}={beta_hat-beta_nula:.2f}")
print(f"t = distancia / SE = {t_obs:.3f}")
errores=se*np.array([.5,1,2]);ts=(beta_hat-beta_nula)/errores
for error,t in zip(errores,ts): print(f"Misma estimación, SE={error:.2f}: t={t:.3f}")
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].axvline(beta_nula,color="black",ls="--",label="Valor nulo")
ax[0].errorbar([beta_hat],[0],xerr=[se],fmt="o",capsize=6,label="Estimación ± 1 SE (no IC 95%)")
ax[0].set(xlabel="Unidades del coeficiente",yticks=[],title="Distancia y precisión");ax[0].legend(fontsize=8)
ax[1].bar([f"SE={s:g}" for s in errores],ts);ax[1].axhline(0,color="gray")
ax[1].set(ylabel="Estadístico t",title="Menos incertidumbre: mayor |t|");fig.tight_layout()
print("Conclusión: t cuenta cuántos errores estándar separan la estimación del valor que plantea H0. El signo indica dirección; el tamaño absoluto mide distancia relativa a la incertidumbre. Una diferencia grande puede ser poco informativa si también es muy imprecisa. Cambiar beta_nula cambia la pregunta, no la estimación.")`
},
{
id:"a4t-distribucion",title:"16 Clase 4 · Distribución t: por qué importan los grados de libertad",
description:"Slide 95. Compara t con normal y simula T=Z/raíz(V/nu), con Z normal y V chi-cuadrado independientes. En regresión simple nu=n−2.",
code:A4T_IMPORTS+String.raw`grados=[5,20,100]; nu=20; B=20000; alfa=.05
if not grados or min(grados)<1 or nu<1 or not 100<=B<=200000 or not 0<alfa<1: raise ValueError("Usa grados positivos, 100<=B<=200000 y 0<alfa<1.")
z=rng.normal(size=B);v=rng.chisquare(nu,size=B);sim=z/np.sqrt(v/nu)
g=np.linspace(-5,5,800);fig,ax=plt.subplots(1,2,figsize=(10,4))
for df in grados:
    ax[0].plot(g,student.pdf(g,df),label=f"t con {df} g.l.")
    print(f"g.l.={df}: corte bilateral {(1-alfa)*100:.1f}% = ±{student.ppf(1-alfa/2,df):.4f}")
ax[0].plot(g,norm.pdf(g),"--",color="black",label="Normal estándar")
ax[0].set(xlabel="t",ylabel="Densidad",title="Las colas cambian con los grados de libertad");ax[0].legend(fontsize=8)
ax[1].hist(sim,bins=np.linspace(-5,5,81),weights=np.ones(B)/(B*.125),alpha=.5,label="Simulación")
ax[1].plot(g,student.pdf(g,nu),label=f"t teórica, nu={nu}");ax[1].set(xlabel="t",ylabel="Densidad",title="Estimar la escala agrega incertidumbre");ax[1].legend(fontsize=8)
print(f"P(|T|>1.96): teoría={2*student.sf(1.96,nu):.4f}; simulación={np.mean(abs(sim)>1.96):.4f}")
fig.tight_layout()
print("Conclusión: con pocos grados de libertad hay más resultados extremos que en una normal. Usar 1.96 sin considerar nu puede rechazar demasiado. La t exacta en regresión requiere errores normales, independientes y homocedásticos, diseño de rango completo y SE clásico; con SE robustos no se obtiene automáticamente esa distribución exacta.")`
},
{
id:"a4t-bilateral",title:"17 Clase 4 · Dos colas: alfa, valor crítico y p-valor",
description:"Slides 96–99. Reproduce t=2.5, nu=20 y compara alfa=5% con 1%. En rojo se muestra la regla elegida; en verde, el área más extrema que el resultado observado.",
code:A4T_IMPORTS+String.raw`t_obs,nu,alfa=2.5,20,.05  # Prueba t_obs=1.5 o alfa=.01
if not np.isfinite(t_obs) or nu<1 or not 0<alfa<1: raise ValueError("Revisa t, nu y alfa.")
crit=student.ppf(1-alfa/2,nu);pvalor=2*student.sf(abs(t_obs),nu)
rechaza=pvalor<=alfa
print(f"Cortes=±{crit:.4f}; t observado={t_obs:.3f}; p bilateral={pvalor:.6g}")
print("Decisión:","Rechazar H0" if rechaza else "No rechazar H0")
print("Misma regla con valores críticos:",abs(t_obs)>=crit)
lim=max(4.5,abs(t_obs)+1,crit+1);g=np.linspace(-lim,lim,2000);dens=student.pdf(g,nu)
fig,ax=plt.subplots(1,2,figsize=(10,4))
for a in ax: a.plot(g,dens,color="black");a.axvline(t_obs,color="C0",label="t observado");a.set(xlabel="t bajo H0",ylabel="Densidad")
ax[0].fill_between(g,0,dens,where=abs(g)>=crit,color="C3",alpha=.5,label=f"Área total alfa={alfa}")
ax[0].axvline(-crit,color="C3",ls="--");ax[0].axvline(crit,color="C3",ls="--");ax[0].set_title("Regla fijada antes de ver los datos")
ax[1].fill_between(g,0,dens,where=abs(g)>=abs(t_obs),color="C2",alpha=.5,label=f"Área p={pvalor:.4f}");ax[1].set_title("Evidencia observada: ambas colas")
for a in ax: a.legend(fontsize=8)
fig.tight_layout()
print("Conclusión: alfa fija de antemano cuánto riesgo de falso rechazo aceptamos. El p-valor depende del resultado: suma ambas colas más allá de ±|t|. Compararlo con alfa da la misma decisión que comparar |t| con el corte. El p-valor no es la probabilidad de que H0 sea verdadera. Las colas continúan fuera del gráfico.")`
},
{
id:"a4t-unilateral",title:"18 Clase 4 · La alternativa decide qué cola mirar",
description:"Slides 100–103. Compara pruebas bilateral, derecha e izquierda usando exactamente el mismo estadístico. Cambia t_obs de 2.5 a −2.5.",
code:A4T_IMPORTS+String.raw`t_obs,nu,alfa=2.5,20,.05
if not np.isfinite(t_obs) or nu<1 or not 0<alfa<1: raise ValueError("Revisa t, nu y alfa.")
pvalores=[2*student.sf(abs(t_obs),nu),student.sf(t_obs,nu),student.cdf(t_obs,nu)]
c2=student.ppf(1-alfa/2,nu);derecha=student.ppf(1-alfa,nu);izquierda=student.ppf(alfa,nu)
lim=max(4.5,abs(t_obs)+1,abs(c2)+1);g=np.linspace(-lim,lim,2000);dens=student.pdf(g,nu)
extremos=[abs(g)>=abs(t_obs),g>=t_obs,g<=t_obs]
regiones=[abs(g)>=c2,g>=derecha,g<=izquierda]
nombres=["Bilateral: beta ≠ beta0","Derecha: beta > beta0","Izquierda: beta < beta0"]
fig,ax=plt.subplots(1,3,figsize=(12,4))
for a,nombre,p,extremo,region in zip(ax,nombres,pvalores,extremos,regiones):
    print(f"{nombre}: p={p:.6f}; {'rechazar' if p<=alfa else 'no rechazar'}")
    a.plot(g,dens,color="black");a.fill_between(g,0,dens,where=extremo,color="C2",alpha=.4,label="Área p")
    a.fill_between(g,0,dens,where=region,facecolor="none",edgecolor="C3",hatch="///",label="Rechazo alfa")
    a.axvline(t_obs,color="C0");a.set(title=f"{nombre}\np={p:.4f}",xlabel="t bajo H0",ylabel="Densidad");a.legend(fontsize=7)
fig.tight_layout()
print("Conclusión: un t positivo grande apoya beta>beta0, pero no beta<beta0. No basta dividir siempre el p bilateral por dos: si el signo va contra la alternativa, el p unilateral es grande. La dirección debe elegirse antes de mirar los datos. En las pruebas unilaterales, la distribución se evalúa en la frontera beta=beta0 de la hipótesis nula.")`
},
{
id:"a4t-intervalo",title:"19 Clase 4 · Intervalo de confianza y prueba: la misma información",
description:"Slides 104–106. Cambia la hipótesis nula sin volver a estimar. Se muestran todos los valores de beta0 y sus p-valores bilaterales.",
code:A4T_IMPORTS+String.raw`beta_hat,se,nu,alfa,beta_nula=65.0,10.0,20,.05,0.0
if se<=0 or nu<1 or not 0<alfa<1 or not np.all(np.isfinite([beta_hat,se,beta_nula])): raise ValueError("Revisa parámetros.")
crit=student.ppf(1-alfa/2,nu);lo=beta_hat-crit*se;hi=beta_hat+crit*se
t_obs=(beta_hat-beta_nula)/se;pvalor=2*student.sf(abs(t_obs),nu)
print(f"IC {100*(1-alfa):.1f}%=[{lo:.4f},{hi:.4f}]; H0: beta={beta_nula}; t={t_obs:.3f}; p={pvalor:.6g}")
print("Decisión:","Rechazar H0" if pvalor<=alfa else "No rechazar H0")
g=np.linspace(min(lo-3*se,beta_nula-se),max(hi+3*se,beta_nula+se),1000)
ps=2*student.sf(abs((beta_hat-g)/se),nu)
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].errorbar([beta_hat],[0],xerr=crit*se,fmt="o",capsize=6);ax[0].axvline(beta_nula,color="C3",label="Valor nulo")
ax[0].set(yticks=[],xlabel="Valores del coeficiente",title="Intervalo bilateral");ax[0].legend()
ax[1].plot(g,ps);ax[1].axhline(alfa,color="C3",ls="--",label="alfa")
ax[1].axvspan(lo,hi,color="C2",alpha=.15,label="IC");ax[1].scatter([beta_nula],[pvalor],color="C3")
ax[1].set(xlabel="Valor propuesto por H0 (beta0)",ylabel="p-valor bilateral",title="¿Qué valores son compatibles?");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: usando el mismo método, los valores fuera del IC se rechazan bilateralmente al nivel alfa; en los extremos p=alfa (caso frontera). No rechazar un valor no demuestra que sea el verdadero. El IC resume incertidumbre sobre un parámetro, no el rango donde caerán los salarios individuales.")`
},
{
id:"a4t-potencia",title:"20 Clase 4 · Error tipo I, tipo II y potencia",
description:"Slide 110 y extensión. Repite regresiones con diseño fijo y errores clásicos normales. Compara falsos rechazos cuando H0 es cierta y detección de efectos cuando es falsa.",
code:A4T_IMPORTS+String.raw`tamanos=[22,60,200]; B=2000; sigma=1.0; alfa=.05; beta_nula=0.0
efectos=np.array([0,.1,.2,.4,.6])  # Diferencias beta verdadero - beta_nula
if B<100 or min(tamanos)<3 or sigma<=0 or not 0<alfa<1 or B*max(tamanos)>2000000: raise ValueError("Usa B>=100,n>=3,sigma>0,0<alfa<1 y B*max(n)<=2 millones.")
fig,ax=plt.subplots(figsize=(8,4.5));resultados={}
for n in tamanos:
    x=np.linspace(-np.sqrt(3),np.sqrt(3),n);xc=x-x.mean();Sxx=xc@xc
    u=rng.normal(0,sigma,size=(B,n));uc=u-u.mean(axis=1,keepdims=True)
    error_pendiente=uc@xc/Sxx;res=uc-error_pendiente[:,None]*xc
    se=np.sqrt(np.sum(res*res,axis=1)/(n-2)/Sxx);crit=student.ppf(1-alfa/2,n-2)
    tasas=[]
    for efecto in efectos:
        t=(efecto+error_pendiente)/se;rechazo=np.mean(abs(t)>=crit);tasas.append(rechazo)
        incertidumbre=np.sqrt(rechazo*(1-rechazo)/B)
        etiqueta="Error tipo I" if efecto==0 else "Potencia"
        print(f"n={n}, beta-beta0={efecto:.2f}: {etiqueta}={rechazo:.3f}, error Monte Carlo≈{incertidumbre:.3f}"+(f", tipo II≈{1-rechazo:.3f}" if efecto!=0 else ""))
    resultados[n]=np.array(tasas);ax.plot(efectos,tasas,"o-",label=f"n={n}")
ax.axhline(alfa,color="gray",ls="--",label="alfa")
ax.set(xlabel="Efecto verdadero menos beta0",ylabel="Fracción de rechazos",ylim=(0,1.03),title="Detectar un efecto requiere señal y precisión");ax.legend();fig.tight_layout()
print("Conclusión: cuando H0 es cierta, una prueba válida todavía rechaza aproximadamente alfa de las veces. Cuando hay un efecto, más datos o menos ruido suelen aumentar la potencia. No rechazar puede deberse a falta de precisión, no a ausencia de efecto. Las frecuencias simuladas fluctúan: B controla la precisión de la simulación, n la de cada regresión.")`
},
{
id:"a4t-elegir-cola",title:"21 Clase 4 · Elegir la cola después de ver los datos",
description:"Slide 103 y cierre. Simulación bajo H0: compara una alternativa predefinida con elegir la dirección que favorece el resultado. No cambia el estimador, cambia la regla de decisión.",
code:A4T_IMPORTS+String.raw`nu,B,alfa=20,30000,.05
if nu<1 or not 100<=B<=200000 or not 0<alfa<.5: raise ValueError("Usa nu>=1,100<=B<=200000,0<alfa<.5.")
t=rng.standard_t(nu,size=B)  # H0 verdadera; referencia exacta bajo supuestos clásicos normales
p_derecha=student.sf(t,nu);p_bilateral=2*student.sf(abs(t),nu)
p_elegida=np.minimum(student.cdf(t,nu),student.sf(t,nu))
tasas=np.array([np.mean(p_derecha<=alfa),np.mean(p_bilateral<=alfa),np.mean(p_elegida<=alfa)])
teoria=np.array([alfa,alfa,2*alfa]);nombres=["Derecha predefinida","Bilateral predefinida","Cola elegida después"]
for nombre,tasa,exacta in zip(nombres,tasas,teoria): print(f"{nombre}: falsos rechazos={tasa:.4f}; teoría={exacta:.4f}")
fig,ax=plt.subplots(figsize=(9,4));j=np.arange(3)
ax.bar(j-.18,tasas,width=.36,label="Simulación");ax.bar(j+.18,teoria,width=.36,label="Teoría")
ax.set(xticks=j,xticklabels=nombres,ylabel="Probabilidad de falso rechazo",title="Elegir la dirección tras observar el signo duplica el error tipo I")
ax.legend();fig.tight_layout()
print("Conclusión: buscar después la cola que da el p más pequeño ofrece dos oportunidades de rechazar, aunque reportes una sola. Al 5% se termina rechazando cerca del 10% bajo H0. Define la alternativa antes del análisis; si cualquiera de las dos direcciones importa, usa una prueba bilateral.")`
},
{
id:"a4t-salario",title:"22 Clase 4 · Actividad de las slides: educación y salario",
description:"Slides 108–109. Reproduce beta_hat=62, SE=8 y n=22. También comprueba la coherencia del R² reportado con esos resúmenes bajo MCO simple y SE clásico.",
code:A4T_IMPORTS+String.raw`beta_hat,se,n,beta_nula,alfa=62.0,8.0,22,0.0,.05
r2_reportado=.42  # Valor en la slide; se verifica, no se usa para calcular t
if n<3 or se<=0 or not 0<alfa<1 or not 0<=r2_reportado<1: raise ValueError("Revisa n, SE, alfa y R².")
nu=n-2;t_obs=(beta_hat-beta_nula)/se;crit=student.ppf(1-alfa/2,nu);pvalor=2*student.sf(abs(t_obs),nu)
lo=beta_hat-crit*se;hi=beta_hat+crit*se
print(f"Un año adicional se asocia con {beta_hat:g} mil pesos más de salario mensual, no necesariamente lo causa.")
print(f"H0: beta={beta_nula}; gl={nu}; t={t_obs:.4f}; p={pvalor:.8g}; corte=±{crit:.4f}")
print(f"IC {100*(1-alfa):.0f}%=[{lo:.2f},{hi:.2f}] mil pesos por año de educación.")
print("Decisión:","Rechazar H0" if pvalor<=alfa else "No rechazar H0")
# Identidad algebraica para H0: beta=0; solo MCO simple con intercepto y SE clásico.
t_cero=beta_hat/se;r2_implicado=t_cero**2/(t_cero**2+nu)
print(f"Control de coherencia: t para H0=0 implica R²={r2_implicado:.6f}; la slide reporta R²={r2_reportado:.2f}.")
if not np.isclose(r2_reportado,r2_implicado,atol=.005):
    print("Aviso: esos resúmenes no pueden pertenecer todos a la misma regresión simple con SE clásico. Aquí usamos beta_hat, SE y n para la prueba, sin reconstruir una base que los reproduzca todos.")
lim=max(4.5,abs(t_obs)+1,crit+1);g=np.linspace(-lim,lim,3000);dens=student.pdf(g,nu)
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].plot(g,dens);ax[0].fill_between(g,0,dens,where=abs(g)>=crit,color="C3",alpha=.3,label="Rechazo")
ax[0].axvline(t_obs,color="C2",label=f"t={t_obs:.2f}");ax[0].set(xlabel="t bajo H0",ylabel="Densidad",title="Resultado observado frente a H0");ax[0].legend(fontsize=8)
ax[1].plot(g,dens);ax[1].fill_between(g,1e-12,dens,where=abs(g)>=abs(t_obs),color="C2",alpha=.5)
ax[1].set(yscale="log",ylim=(1e-10,1),xlabel="t bajo H0",ylabel="Densidad (escala logarítmica)",title=f"Ver colas pequeñas: p={pvalor:.2g}")
fig.tight_layout()
print(f"Conclusión: {'hay evidencia para rechazar' if pvalor<=alfa else 'no hay evidencia suficiente para rechazar'} beta={beta_nula:g} al nivel {100*alfa:g}%. No rechazar no demuestra igualdad, y rechazar no establece causalidad. El p-valor usa el área de las colas en la escala original: la escala logarítmica del gráfico solo ayuda a verlas. Conviene verificar también que los resúmenes de una regresión sean coherentes entre sí.")`
}
];
A4T_LABS.forEach(example=>ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",classNumber:4,filename:example.title+".py"}));
