
document.addEventListener("DOMContentLoaded", () => {

    // FAQ generation
    const faqData = [ 
        { question: "What are these chemicals?",
            answer: "NO<sub>x</sub> is nitrogen oxides, H<sub>2</sub>O is water vapour, CO<sub>2</sub> is carbon dioxide, BC is black carbon or soot, Al<sub>2</sub>O<sub>3</sub> is aluminium oxide or alumina, and Cl<sub>y</sub> is a family of chlorine compounds. NO<sub>x</sub>, H<sub>2</sub>O, CO<sub>2</sub>, and Cl<sub>y</sub> are released as gases, BC and Al<sub>2</sub>O<sub>3</sub> as particles."
        },
        { question: "How do these chemicals affect the atmosphere?",
            answer: "Unlike man-made emissions from the surface of the Earth, rocket launches release air pollutant and CO<sub>2</sub> emissions throughout the atmosphere, where they can have an outsized impact on our atmosphere and climate. NO<sub>x</sub> and Cl<sub>y</sub> are the largest contributors to destruction of the ozone layer from rocket emissions, with smaller destruction occuring from emissions of BC and Al<sub>2</sub>O<sub>3</sub> particles. The largest climate impacts come from BC emissions, which warm the upper layers of the atmosphere while cooling the lower layers."
        },
        { question: "What does each filter represent?",
            answer: "Launch site refers to the location of the rocket launch. Launch vehicle refers to the type of rocket used for the launch. Megaconstellation refers to whether the launch contains megaconstellation payloads."
        },
        { question: "How is this data calculated?",
            answer: "Our calculations are based on the current best scientific knowledge available for emissions from rocket launches. We include the effects of a changing chemical environment with altitude in our launch emissions, and calculate geolocated emissions globally up to a maximum altitude of 80 km. Paths shown in the Globe view are fixed at the launch site and do not represent real rocket trajectories. Emissions from failed launches before 2020 are not included."
        },
        { question: "Where can I find the original methodology and data?",
        answer: "You can find further details on the methodology in our study published in Nature Scientific Data: Global 3D rocket launch and re-entry air pollutant and carbon dioxide emissions for 2020-2022</strong>. C. R. Barker, E. A. Marais (2024). doi:10.5522/04/26325382. [<a href='https://doi.org/10.5522/04/26325382' target='_blank' rel='noopener noreferrer'>Data</a>]. [<a href='https://www.nature.com/articles/s41597-024-03910-z' target='_blank' rel='noopener noreferrer'>Publication</a>]. For details of changes since the publication, please visit the <a href='https://github.com/cbarker211/Emissions_API/blob/main/docs/changefile.md' target='_blank' rel='noopener noreferrer'>changefile.</a>"
        }
    ];
    const faqsContainer = document.getElementById('faqs-container');

    if (faqsContainer) {
        faqData.forEach(item => {
            let article = document.createElement('article');
            article.classList.add('faq-item');

            article.innerHTML = `
                <div class="filter">
                    <label>${item.question}</label>
                </div>
                <div class="item-answer">
                    <span>${item.answer}</span>
                </div>
            `;

            faqsContainer.append(article);
        });

        document.querySelectorAll('.filter').forEach(q => {
            q.addEventListener('click', () => {
                q.parentElement.classList.toggle("show-answer");
            });
        });
    }

    // Modal logic
    const modal = document.getElementById("faqModal");
    const faqButton = document.getElementById("faqButton");
    const closeBtn = document.getElementById("closeModal");

    //modal.classList.add("active")

    // open via button
    faqButton.onclick = () => {
        modal.classList.add("active");
    };

    // close
    closeBtn.onclick = () => {
        modal.classList.remove("active");
    };

    // click outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    };

});

