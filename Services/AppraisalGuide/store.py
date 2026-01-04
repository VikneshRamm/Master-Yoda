from models import Designation, Project


available_designations = [
    Designation(id="1", name="Project Engineer", description="Responsible for developing software applications."),
    Designation(id="2", name="Senior Project Engineer", description="Focuses on analyzing and interpreting complex data to help companies make decisions."),
    Designation(id="3", name="Technical Lead", description="Oversees projects to ensure they are completed on time and within budget."),
    Designation(id="4", name="Project Lead", description="Manages and automates the deployment and operation of software systems."),
    Designation(id="5", name="Senior Technical Lead", description="Designs user interfaces and experiences to enhance user satisfaction."),
    Designation(id="6", name="Senior Project Lead", description="Designs user interfaces and experiences to enhance user satisfaction."),
    Designation(id="7", name="Solution Architect", description="Designs user interfaces and experiences to enhance user satisfaction."),
    Designation(id="8", name="Project Manager", description="Designs user interfaces and experiences to enhance user satisfaction."),
]

available_outcomes = {
    "Project Engineer": [{
        "outcome": "Deliver high-quality impactful features to customers",
        "expectation": "Understand the requirements of customers for impactful features that "
        "contribute to business outcomes. Consistently deliver clean, efficient, high-quality, "
        "on-time, and maintainable code along with documentation that meets the requirements."
        },
    ],
    "Senior Project Engineer": [{
        "outcome": "Deliver high-quality, impactful modules to customers on time",
        "expectation": "Understand the project requirements and objectives that contribute to "
        "business outcomes. Drive them to actionable plan and achieve success by architecting and"
        " implementing scalable, reliable, maintainable, and efficient modules, "
        "ensuring on-time high-quality delivery within budget. "
        }, {
            "outcome": "Stakeholders (Customers and/or leads) are always up to date with the status of your module",
            "expectation": "Take full ownership of modules from concept to delivery."
            " Maintain clear and effective communication with internal stakeholders and customers"
            " by providing clear visibility on progress. Respond to customer needs and feedback"
            " promptly and professionally. "
        }
    ],
}
