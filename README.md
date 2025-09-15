##Setting Up Your Environment
1. Install Django, django-filter and djangorestframework into your virtual environment
This is how you packages list should look like after doing the 3 installs
!(Image of python packages](<img width="600" height="200" alt="image" src="https://github.com/user-attachments/assets/75160251-e42f-4b6e-808a-849aebf2a676" />)
2. Clone the repo, there is several methods to this and I would recommend doing it by url
3. In your terminal, navigate to /claims-management/claims_manage/ - this is where the magic happens (the picture also shows the path)
4. Load database migrations by running the following command in your terminal "python manage.py migrate"
5. If you want to use the default data, the one given in the challenege page, run "python manage.py load_db" this loads the data into the table
If you want to APPEND data to the tables- "python manage.py load_db --append --details-file [filepath equivalent to details file] --list-file [filepath equivalent to list file]
If you want to REPLACE data - "python manage.py load_db --details-file [filepath equivalent to details file] --list-file [filepath equivalent to list file]" 
Note how the "--append" option goes away
##The server is ready to run!!!
6. Now type "python manage.py runserver" in your terminal and follow the link it gives you or type in your browser -"http://127.0.0.1:8000/"
