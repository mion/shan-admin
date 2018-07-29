from django.shortcuts import render

def dashboard(request):
    ctx = {}
    return render(request, 'shancms/dashboard.html', ctx)
