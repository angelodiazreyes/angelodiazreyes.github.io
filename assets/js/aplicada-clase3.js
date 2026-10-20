// Clase 3: estructuras de datos. Cada ejemplo es autónomo y usa datos ficticios.
const A3_IMPORTS = String.raw`import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
rng=np.random.default_rng(123)
pd.set_option("display.width",110)
pd.set_option("display.max_columns",10)
`;
const A3_LABS = [
{
id:"a3-transversal",title:"01 Clase 3 · Corte transversal: una foto de muchas personas",
description:"Slides 2–3 y 8–17. Una fila por persona, todas en el mismo año. Cambia n y B para distinguir tamaño de cada muestra y número de muestras simuladas. No son datos de CASEN.",
code:A3_IMPORTS+String.raw`n,B,anio=200,1000,2025  # n=personas; B=muestras independientes
base,retorno,sigma=700.0,.08,.35  # Ingreso en miles de pesos; sigma=dispersión logarítmica
if not isinstance(n,int) or not isinstance(B,int) or n<10 or B<100 or n*B>2000000:
    raise ValueError("Usa enteros n>=10, B>=100 y n*B<=2 millones.")
if base<=0 or not -.3<=retorno<=.3 or not 0<sigma<=1.5: raise ValueError("Usa base>0, -.3<=retorno<=.3 y 0<sigma<=1.5.")
educaciones=np.array([8,12,16,20]);probs=np.array([.15,.45,.30,.10])
educ=rng.choice(educaciones,size=(B,n),p=probs)
ingresos=base*np.exp(retorno*(educ-12)+rng.normal(0,sigma,(B,n)))
d=pd.DataFrame({"id_persona":np.arange(1,n+1),"anio":anio,"educacion":educ[0],"ingreso_miles":ingresos[0]})
mu=base*np.exp(sigma**2/2)*np.sum(probs*np.exp(retorno*(educaciones-12)))
segundo=base**2*np.exp(2*sigma**2)*np.sum(probs*np.exp(2*retorno*(educaciones-12)))
sd_poblacional=np.sqrt(segundo-mu**2); medias=ingresos.mean(axis=1)
print("DATOS SIMULADOS: muchas personas, un solo período. Clave de cada fila: id_persona.")
print(d.head(10).round(2).to_string(index=False))
print(f"Filas={len(d)}; personas={d.id_persona.nunique()}; años={d.anio.nunique()}")
print(f"Media de esta muestra={medias[0]:.2f}; media poblacional conocida por el simulador={mu:.2f}")
print(f"SD de las {B} medias={medias.std(ddof=1):.2f}; teoría iid sigma_Y/raíz(n)={sd_poblacional/np.sqrt(n):.2f}")
reordenada=d.sample(frac=1,random_state=42)
print("¿Reordenar filas conserva la media?",np.isclose(d.ingreso_miles.mean(),reordenada.ingreso_miles.mean()))
fig,ax=plt.subplots(1,2,figsize=(10,4.5))
ax[0].scatter(d.educacion,d.ingreso_miles,s=16,alpha=.35)
ax[0].set(xticks=educaciones,xlabel="Educación (años)",ylabel="Ingreso (miles de pesos)",title=f"Corte transversal: personas en {anio}")
ax[1].hist(medias,bins=35,alpha=.75);ax[1].axvline(mu,color="black",ls="--",label="Media poblacional")
ax[1].axvline(medias[0],color="C1",label="Media de la base mostrada")
ax[1].set(xlabel="Media de una muestra",ylabel="Frecuencia",title=f"{B} muestras distintas de {n} personas");ax[1].legend(fontsize=8)
fig.tight_layout()
print("Conclusión: el corte transversal es una foto de muchas personas en un mismo momento. No muestra cómo cambió una persona. Su orden de filas no tiene significado temporal. Aquí aumentar n reduce la dispersión de la media porque simulamos personas independientes; aumentar B solo mejora la simulación. Un corte transversal real no garantiza independencia ni representatividad, y una asociación educación-ingreso no prueba causalidad.")`
},
{
id:"a3-panel",title:"02 Clase 3 · Panel: seguir a las mismas personas en el tiempo",
description:"Slides 6–7. Una fila por persona y año. Cambia N, T o fraccion_faltante para pasar de un panel balanceado a uno incompleto. Distingue diferencias entre personas de cambios dentro de una persona.",
code:A3_IMPORTS+String.raw`N,T,anio_inicial=30,6,2020  # N=personas; T=años
crecimiento,dispersion_personas,ruido=35.0,180.0,60.0  # Miles de pesos
fraccion_faltante=0.0  # Prueba .25: se pierden observaciones al azar
if not isinstance(N,int) or not isinstance(T,int) or N<5 or T<2 or N*T>20000:
    raise ValueError("Usa enteros N>=5,T>=2 y N*T<=20000.")
if dispersion_personas<0 or ruido<0 or not 0<=fraccion_faltante<=.6: raise ValueError("Dispersiones no negativas; 0<=fraccion_faltante<=.6.")
anios=np.arange(anio_inicial,anio_inicial+T)
efecto_persona=rng.normal(0,dispersion_personas,N)
ingreso=1000+efecto_persona[:,None]+crecimiento*np.arange(T)+rng.normal(0,ruido,(N,T))
completa=pd.DataFrame({"id_persona":np.repeat(np.arange(1,N+1),T),"anio":np.tile(anios,N),"ingreso_miles":ingreso.ravel()})
conservar=rng.random(N*T)>=fraccion_faltante
d=completa.loc[conservar].copy()
if d.empty: raise ValueError("No quedaron observaciones; reduce la fracción faltante.")
tabla=d.pivot(index="id_persona",columns="anio",values="ingreso_miles").reindex(index=np.arange(1,N+1),columns=anios)
balanceado=bool(tabla.notna().all().all())
print("DATOS SIMULADOS. Clave única: (id_persona, anio). El mismo ID representa siempre a la misma persona.")
print(d.head(12).round(2).to_string(index=False))
print(f"Filas observadas={len(d)} de {N*T}; personas observadas={d.id_persona.nunique()}; años observados={d.anio.nunique()}; balanceado={balanceado}")
print("Las mismas personas en columnas de años (NaN indica dato faltante):\n",tabla.head(6).round(1).to_string())
pares=tabla[[anios[0],anios[-1]]].dropna()
if len(pares):
    cambio=pares[anios[-1]]-pares[anios[0]]
    print(f"Cambio medio entre extremos para las {len(pares)} mismas personas observadas en ambos años={cambio.mean():.2f}")
else: print("No hay personas observadas en ambos extremos; no calculamos ese cambio.")
print(f"Cambio esperado por persona entre extremos en este modelo={crecimiento*(T-1):.2f}")
print("Promedios por persona (diferencias entre personas):\n",d.groupby("id_persona").ingreso_miles.mean().head(6).round(1).to_string())
print("Con datos faltantes, las medias por persona también reflejan qué años observamos; no son efectos individuales puros.")
fig,ax=plt.subplots(1,2,figsize=(11,4.5))
for persona in tabla.index[:5]: ax[0].plot(anios,tabla.loc[persona],"o-",label=f"Persona {persona}")
ax[0].set(xlabel="Año",ylabel="Ingreso (miles de pesos)",title="Cada línea sigue al mismo ID");ax[0].legend(fontsize=8)
visibles=min(N,12);ax[1].imshow(tabla.iloc[:visibles].notna().to_numpy(),cmap="Blues",vmin=0,vmax=1,aspect="auto",interpolation="nearest")
ticks=np.unique(np.linspace(0,T-1,min(T,6),dtype=int))
ax[1].set(xticks=ticks,xticklabels=anios[ticks],yticks=np.arange(visibles),yticklabels=tabla.index[:visibles],xlabel="Año",ylabel="ID persona",title="Azul: observado; blanco: faltante")
fig.tight_layout()
print("Conclusión: un panel reúne varias fotos de las MISMAS personas. Permite comparar personas y seguir cambios dentro de cada una. N×T filas no equivalen a N×T personas independientes: cada persona conserva características propias. Fotografiar personas diferentes cada año sería un corte transversal repetido, no este panel. Aquí los faltantes son al azar; si quienes pierden ingresos abandonaran la encuesta, el promedio observado podría sesgarse. Seguir personas no demuestra por sí solo causalidad.")`
},
{
id:"a3-tiempo",title:"03 Clase 3 · Series de tiempo: orden, tendencia y persistencia",
description:"Slides 4–5 y conexión con 12–17. Una serie mensual ficticia de inflación. Cambia rho, tendencia o estacionalidad. La simulación separa el patrón determinista de un componente aleatorio AR(1) estacionario.",
code:A3_IMPORTS+String.raw`T,B=120,1200  # T=meses por serie; B=series simuladas
rho,sigma=.8,1.0  # Persistencia y desviación marginal del componente aleatorio
nivel,tendencia,estacionalidad=3.0,.01,.4  # Porcentaje; tendencia en puntos porcentuales por mes
if not isinstance(T,int) or not isinstance(B,int) or not 24<=T<=1200 or B<100 or T*B>2000000:
    raise ValueError("Usa enteros 24<=T<=1200,B>=100 y T*B<=2 millones.")
if not -1<rho<1 or sigma<=0: raise ValueError("Usa -1<rho<1 y sigma>0.")
fechas=pd.date_range("2015-01-01",periods=T,freq="MS");mes=np.arange(T)
patron=nivel+tendencia*mes+estacionalidad*np.sin(2*np.pi*mes/12)
# Inicio estacionario; ajustamos innovaciones para mantener Var(u_t)=sigma² al cambiar rho.
u=np.empty((B,T));u[:,0]=rng.normal(0,sigma,B)
for t in range(1,T): u[:,t]=rho*u[:,t-1]+rng.normal(0,sigma*np.sqrt(1-rho**2),B)
d=pd.DataFrame({"mes":fechas,"inflacion":patron+u[0],"patron_conocido":patron,"componente_aleatorio":u[0]})
medias=u.mean(axis=1);h=np.arange(1,T)
sd_exacta=sigma*np.sqrt((1+2*np.sum((1-h/T)*rho**h))/T)
sd_iid=sigma/np.sqrt(T)
print("DATOS SIMULADOS: una misma serie en meses distintos. Clave de cada fila: mes.")
print(d.head(10).round(3).to_string(index=False))
print(f"Filas={len(d)}; series observadas en esta base=1; meses={d.mes.nunique()}")
print(f"Promedio de inflación observado={d.inflacion.mean():.3f}; promedio esperado del patrón={patron.mean():.3f}")
print(f"Correlación muestral entre u_t y u_(t-1)={np.corrcoef(u[0,1:],u[0,:-1])[0,1]:.3f}; poblacional rho={rho}")
print(f"SD de promedios del componente aleatorio: simulada={medias.std(ddof=1):.4f}; exacta AR(1)={sd_exacta:.4f}; fórmula iid={sd_iid:.4f}")
print("La fórmula exacta usa el proceso conocido por el simulador; no es un SE estimado desde una serie real.")
fig,ax=plt.subplots(2,2,figsize=(11,7))
ax[0,0].plot(fechas,d.inflacion,label="Serie observada");ax[0,0].plot(fechas,patron,ls="--",label="Tendencia + estacionalidad conocidas")
ax[0,0].set(xlabel="Mes",ylabel="Inflación (%)",title="El orden temporal importa");ax[0,0].legend(fontsize=7)
ax[0,1].scatter(u[0,:-1],u[0,1:],s=12,alpha=.6);ax[0,1].set(xlabel="Componente aleatorio del mes anterior",ylabel="Componente del mes actual",title="Persistencia, después de quitar el patrón")
ax[1,0].hist(medias,bins=35,alpha=.7);ax[1,0].axvline(0,color="black",ls="--")
ax[1,0].set(xlabel="Promedio del componente aleatorio",ylabel="Frecuencia",title=f"{B} series de {T} meses cada una")
ax[1,1].bar(["Supone iid","Exacta AR(1)","Simulación"],[sd_iid,sd_exacta,medias.std(ddof=1)])
ax[1,1].set(ylabel="SD del promedio",title="Dependencia cambia la información")
fig.tight_layout()
print("Conclusión: una serie temporal es una película de una misma variable. Cambiar el orden rompe su historia y sus rezagos, aunque no cambie el promedio. Con rho positivo, los shocks persisten y varios meses aportan menos información independiente de la que sugiere T; con rho=0 recuperamos el caso iid del componente aleatorio, y con rho negativo puede haber compensación. La tendencia y la estacionalidad no son lo mismo que la persistencia de los shocks. Aquí conocemos el patrón y lo quitamos; en datos reales habría que estimarlo.")`
}
];
A3_LABS.forEach(example=>ECON_PYTHON_EXAMPLES.push({...example,course:"econometria-aplicada-1",classNumber:3,filename:example.title+".py"}));
