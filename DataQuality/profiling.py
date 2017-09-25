from enum import Enum
from collections import OrderedDict
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from os import system
from pylatex import Document, Section, Subsection, Command, Tabular, Figure
from pylatex.utils import NoEscape
from unicodedata import normalize
plt.style.use('seaborn-whitegrid')
import unicodedata


"""
Para cada campo, un estudio estadístico que incluye, según el tipo de dato:
- Texto no categórico
  - Número de valores distintos
  - Porcentaje de valores que son únicos
  - Número de valores faltantes
  - Porcentaje de valores faltantes
  - Moda, en caso de que el número de valores distintos sea <= 30.
    Ente estadístico debe ignorarse según se convenga. Ej: campos administrativos
- Texto categórico
  - Número de valores distintos
  - Porcentaje de valores que son únicos
  - Número de valores faltantes
  - Porcentaje de valores faltantes
  - Moda
  - Histograma
- Numérico ordinal
  - Número de valores distintos
  - Porcentaje de valores que son únicos
  - Número de valores faltantes
  - Porcentaje de valores faltantes
  - Moda
  - Mínimo
  - Máximo
  - Promedio
  - Desvest
  - Histograma
- Numérico nominal
  - Número de valores distintos
  - Porcentaje de valores que son únicos
  - Número de valores faltantes
  - Porcentaje de valores faltantes
- Fecha
  - Número de valores distintos
  - Porcentaje de valores que son únicos
  - Número de valores faltantes
  - Porcentaje de valores faltantes
  - Fecha mínima
  - Fecha máxima
  - Moda (Ignorar según se convenga)
"""


caoba_blue = 'b'


class DataType(Enum):
    CATEG = 'Categórica'
    NO_CATEG = 'No Categórica'
    NUM = 'Numérico'
    DATE = 'Fecha'


def clean(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def estudio_estadistico(df, campo, clase, path_hist):
    """Estadísticos e histograma para el campo dado."""
    if type(clase) != DataType:
        raise Exception('Tipo de dato invalido para campo {}. Se encontró {}'.format(campo, clase))
    resultados = OrderedDict({})
    resultados['Tipo'] = clase.value
    # Serie con la columna
    column = df[campo]
    # ESTADISTICO: distintos
    distintos = column.nunique()
    resultados['Distintos'] = '{}'.format(distintos)
    # ESTADISTICO: faltantes (num y porcentaje)
    faltantes = sum(column.isnull())
    p_faltantes = 100*faltantes/len(column)
    resultados['Faltantes'] = '{} ({:.3f}%)'.format(faltantes, p_faltantes)
    # usar solo los registros no nulos
    column = column[column.notnull()]
    # ESTADISTICO: moda
    mode = column.mode()
    resultados['Moda'] = '{}'.format(mode[0] if len(mode)>0 else 'No tiene')
    # ESTADISTICO: numericos
    if clase == DataType.NUM and p_faltantes != 100:
        resultados['Mínimo'] = '{}'.format(column.min())
        resultados['Máximo'] = '{}'.format(column.max())
        resultados['Media'] = '{:.2f}'.format(column.mean())
        resultados['Desviación estandar'] = '{:.2f}'.format(column.std())
        resultados['1Q'] = '{:.2f}'.format(column.quantile(0.25))
        resultados['Mediana'] = '{:.2f}'.format(column.quantile(0.5))
        resultados['3Q'] = '{:.2f}'.format(column.quantile(0.75))
        resultados['Asimetría'] = '{:.2f}'.format(column.skew())
        resultados['Curtosis'] = '{:.2f}'.format(column.kurtosis())
    # ESTADISTICO: fechas
    if clase == DataType.DATE and p_faltantes != 100:
        resultados['Mínimo'] = '{}'.format(column.min())
        resultados['Máximo'] = '{}'.format(column.max())
    # HISTOGRAMAS
    plot_path = ''
    if clase != DataType.NO_CATEG and p_faltantes != 100 and distintos!=1:
        fig = plt.figure(figsize=(4,4))
        ax = plt.axes()
        if clase == DataType.DATE:
            data = mdates.date2num(column.dt.to_pydatetime())
            ax.hist(data, orientation='horizontal', edgecolor='None', color=caoba_blue, bins=100)
            locator = mdates.AutoDateLocator()
            ax.yaxis.set_major_locator(locator)
            ax.yaxis.set_major_formatter(mdates.AutoDateFormatter(locator))
        elif clase == DataType.NUM:
            ax.hist(column, orientation='horizontal', edgecolor='None', color=caoba_blue, bins=100)
            bins_list = ax.patches
            ancho_bin_1 = bins_list[0].get_width()
            n_bin = 0
            bin_def = False
            for i in range(len(bins_list)):
                if ancho_bin_1 > bins_list[i].get_width()*50 and not bin_def:
                    n_bin = i
                    bin_def = True
                if bin_def and not ancho_bin_1 > bins_list[i].get_width()*50:
                    bin_def = False
                if not bin_def:
                    n_bin = i
            ax.hist(column, orientation='horizontal', edgecolor='None', color=caoba_blue,
                    range=(column.min(), column.min()+(bins_list[0].get_height()*n_bin)), bins=100)
        elif p_faltantes != 100:
            column.astype(str).value_counts()[:10].plot(kind='barh', color=caoba_blue, edgecolor='None')
            max_width = -1
            for p in ax.patches:
                if p.get_width() > max_width:
                    max_width = p.get_width()
                ax.annotate('{} ({} %)'.format(p.get_width(), round(p.get_width()*100.0/len(column), 2)),
                            (p.get_width(), p.get_y() + p.get_height()*.5),
                            rotation='horizontal')
                ax.set_xlim(0, 2*max_width)
        plot_path = '{}/{}.png'.format(path_hist, clean(campo.replace(' ','_').replace('(','')
                                                        .replace(')','').replace(':','_')
                                                        .replace('.','').replace('%','')))
        plt.tight_layout()
        plt.savefig(plot_path, dpi=200)
        plt.close()
    return {'campo': campo, 'resultados': resultados, 'plot': plot_path}


def generar_estudio(df, campos, filename):
    for campo in campos:
        if campo['campo'] not in df.columns:
            raise Exception('el campo {} no se encuentra en el dataframe'.format(campo['campo']))
    path_hist = 'histogramas_{}'.format(filename)
    system('mkdir {}'.format(path_hist))
    estudio = []
    for row in campos:
        estudio.append(estudio_estadistico(df, row['campo'], row['tipo'], path_hist))
    return estudio


def generar_reporte(df, filename, campos):
    filename = clean(filename)
    estudio = generar_estudio(df, campos, filename)
    geometry_opts = {'lmargin':'1in', 'tmargin':'1in' , 'rmargin':'1in', 'bmargin':'1in'}
    doc = Document(geometry_options=geometry_opts)
    doc.packages.append(NoEscape('\\usepackage{graphicx}'))
    #doc.preamble.append(Command('title', filename.upper()))
    doc.preamble.append(Command('date', ''))
    #doc.append(NoEscape(r'\maketitle'))
    with doc.create(Section(filename)):
        with doc.create(Tabular('|l|l|')) as table:
            table.add_hline()
            table.add_row(('Descripción', ''))
            table.add_hline()
            table.add_row(('Período', ''))
            table.add_hline()
            table.add_row(('Extensión', ''))
            table.add_hline()
            table.add_row(('Volumen (#filas)', ''))
            table.add_hline()
            table.add_row(('Campos (#columnas)', ''))
            table.add_hline()
            table.add_row(('Fecha recepción', ''))
            table.add_hline()
        for campo in estudio:
            with doc.create(Subsection(campo['campo'])):
                with doc.create(Tabular('|l|l|')) as table:
                    table.add_hline()
                    table.add_row(('Alias', ''))
                    table.add_hline()
                    table.add_row(('Descripción', ''))
                    table.add_hline()
                    table.add_row(('Dominio', ''))
                    table.add_hline()
                    table.add_row(('Relevante', ''))
                    for resultado in campo['resultados'].items():
                        table.add_hline()
                        table.add_row(resultado)
                    if campo['plot']:
                        table.add_hline()
                        table.add_row(('Gráfica',
                                       NoEscape('\includegraphics[width=200px]{'+campo['plot']+'}')))
                        table.add_hline()
    doc.generate_pdf(filename, clean_tex=False)

